<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Map frontend provider names to Selcom API provider codes
     */
    private function mapProviderForSelcom(string $provider): string
    {
        $mapping = [
            'TIGO' => 'TIGO',
            'MPESA' => 'MPESA', 
            'AIRTEL' => 'AIRTEL',
            // HALOTEL temporarily disabled due to 406 error from Selcom
            // 'HALOTEL' => 'HALOTEL',
        ];

        // If exact match exists, use it
        if (isset($mapping[$provider])) {
            return $mapping[$provider];
        }

        // Fallback: try common variations and correct Selcom codes
        $provider = strtoupper($provider);
        switch ($provider) {
            case 'TIGO':
            case 'TIGOPESA':
                return 'TIGO';
            case 'MPESA':
            case 'M_PESA':
                return 'MPESA';
            case 'AIRTEL':
            case 'AIRTELMONEY':
                return 'AIRTEL';
            case 'HALOTEL':
            case 'HALOTELMONEY':
                // Halotel currently not supported by Selcom API
                throw new \Exception('Halotel payments are currently not supported. Please use Tigo Pesa, M-Pesa, or Airtel Money.');
            default:
                throw new \Exception("Unsupported provider: {$provider}");
        }
    }

    public function initiateMobileMoney(Request $request)
{
    try {
        $validated = $request->validate([
            'amount'         => 'required|numeric|min:1000',
            'phone_number'   => 'required|string|min:10|max:13',
            'provider'       => 'required|in:TIGO,MPESA,AIRTEL',
            'customer_email' => 'required|email',
            'customer_name'  => 'required|string',
            'order_id'       => 'required|string',
            'payment_type'   => 'required|string',
            'property_id'    => 'required|integer',
            'tenant_id'      => 'required|integer',
        ]);

        $vendorId  = env('SELCOM_VENDOR_ID');
        $apiKey    = env('SELCOM_API_KEY');
        $apiSecret = env('SELCOM_API_SECRET');
        $baseUrl   = env('SELCOM_BASE_URL', 'https://apigw.selcommobile.com/v1');

        // ── Normalize phone to 255XXXXXXXXX ──────────────────────────────────
        $phone = preg_replace('/\D/', '', $validated['phone_number']);
        if (str_starts_with($phone, '0')) {
            $phone = '255' . substr($phone, 1);
        } elseif (!str_starts_with($phone, '255')) {
            $phone = '255' . $phone;
        }

        // ── Build body ────────────────────────────────────────────────────────
        $selcomData = [
            'vendor'         => $vendorId,
            'order_id'       => $validated['order_id'],
            'buyer_email'    => $validated['customer_email'],
            'buyer_name'     => $validated['customer_name'],
            'buyer_phone'    => $phone,
            'amount'         => (int) $validated['amount'],
            'currency'       => 'TZS',
            'payment_phone'  => $phone,
            'provider'       => $this->mapProviderForSelcom($validated['provider']),
            'no_of_items'    => 1,
            'header_colour'  => '#FF0000',
            'buyer_remarks'  => $validated['payment_type'],
            'merchant_name'  => 'RentalApp',
            'redirect_url'   => url('/payment/success'),
            'cancel_url'     => url('/payment/cancel'),
            'webhook'        => url('/api/payment/webhook'),
            'expiry'         => date('c', strtotime('+1 hour')),
        ];

        $body = json_encode($selcomData);

        // ── Selcom signature (Base64 HMAC-SHA256, NOT hex) ────────────────────
        $timestamp = (string) (time() * 1000);   // milliseconds
        $nonce     = Str::random(32);

        // The string to sign: timestamp + nonce + body
        $signaturePayload = $timestamp . $nonce . $body;
        $signature        = base64_encode(hash_hmac('sha256', $signaturePayload, $apiSecret, true));

        // Digest: Base64-encoded SHA-256 of the body
        $digest = 'SHA-256=' . base64_encode(hash('sha256', $body, true));

        Log::info('Initiating Selcom payment', ['order_id' => $validated['order_id'], 'phone' => $phone]);

        $response = Http::withHeaders([
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
            'Authorization' => 'SELCOM ' . base64_encode($apiKey),
            'Digest'        => $digest,
            'Timestamp'     => $timestamp,
            'Nonce'         => $nonce,
            'Signed-Fields' => 'timestamp,nonce,digest',
            'Signature-Method' => 'HS256',
        ])->withBody($body, 'application/json')
          ->post($baseUrl . '/checkout/create-order-minimal');

        Log::info('Selcom API response', [
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if ($response->successful()) {
            $result = $response->json();

            return response()->json([
                'success' => true,
                'data'    => [
                    'transaction_id' => $result['data']['transid'] ?? $validated['order_id'],
                    'order_id'       => $validated['order_id'],
                    'status'         => 'pending',
                ],
                'message' => 'Payment initiated successfully',
            ]);
        }

        if (app()->environment('local')) {
            return response()->json([
                'success' => true,
                'data'    => [
                    'transaction_id' => 'DEV_' . uniqid(),
                    'order_id'       => $validated['order_id'],
                    'status'         => 'pending',
                ],
                'message' => 'Development mode – payment simulated',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Payment initiation failed: ' . $response->body(),
        ], $response->status());

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'error'   => 'VALIDATION_ERROR',
            'message' => 'Validation failed',
            'errors'  => $e->errors(),
        ], 422);
    } catch (\Exception $e) {
        Log::error('Payment initiation error', ['error' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'message' => 'Payment processing error: ' . $e->getMessage(),
        ], 500);
    }
}
    /**
     * Handle Selcom webhook
     */
    public function handleWebhook(Request $request)
    {
        try {
            Log::info('Selcom webhook received', $request->all());

            // Process webhook data
            $webhookData = $request->all();
            
            // TODO: Process payment status updates
            // - Update application status
            // - Notify agent
            // - Send confirmation to tenant

            return response()->json(['status' => 'received']);

        } catch (\Exception $e) {
            Log::error('Webhook processing error', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }
}
