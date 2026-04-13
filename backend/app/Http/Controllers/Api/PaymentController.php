<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Build Selcom auth headers.
     * Signature string: "timestamp={ts}&{field1}={val1}&{field2}={val2}..."
     * (fields must be in the same order as Signed-Fields header)
     */
    private function computeSelcomHeaders(array $params, string $apiKey, string $apiSecret): array
    {
        // Timestamp in Selcom format - YYYY-MM-DD HH:MM:SS
        $timestamp = date('Y-m-d H:i:s'); // yyyy-mm-dd H:i:s correct Selcom format

        // Fields to sign (must match what we put in Signed-Fields header below)
        $signedFields = 'transid,amount,msisdn,vendor';

        // Build the string to sign: timestamp first, then each field
        $signData = "timestamp={$timestamp}";
        foreach (explode(',', $signedFields) as $field) {
            $signData .= "&{$field}=" . $params[$field];
        }

        // Base64( HMAC-SHA256(signData, apiSecret) )  — raw binary then base64
        $digest = base64_encode(hash_hmac('sha256', $signData, $apiSecret, true));

        // Authorization token = Base64(apiKey)
        $authorization = base64_encode($apiKey);

        return [
            'Authorization' => "SELCOM {$authorization}",
            'Digest-Method' => 'HS256',
            'Digest'        => $digest,
            'Timestamp'     => $timestamp,
            'Signed-Fields' => $signedFields,
        ];
    }

    private function mapProviderForSelcom(string $provider): string
    {
        $map = [
            'TIGO'   => 'TIGOPESA',
            'MPESA'  => 'MPESA',
            'AIRTEL' => 'AIRTEL',
        ];
        $upper = strtoupper($provider);
        if (!isset($map[$upper])) {
            throw new \Exception("Unsupported provider: {$provider}");
        }
        return $map[$upper];
    }

    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);
        if (str_starts_with($phone, '0')) {
            return '255' . substr($phone, 1);
        }
        if (!str_starts_with($phone, '255')) {
            return '255' . $phone;
        }
        return $phone;
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
            $apiKey    = env('SELCOM_API_KEY');  // Use correct Selcom API key
            $apiSecret = env('SELCOM_API_SECRET');
            $baseUrl   = env('SELCOM_BASE_URL', 'https://apigw.selcommobile.com/v1');

            $phone    = $this->normalizePhone($validated['phone_number']);
            $amount   = (int) $validated['amount'];
            $transid  = $validated['order_id'];
            $provider = $this->mapProviderForSelcom($validated['provider']);

            // These are the params that get signed (must match signedFields in computeSelcomHeaders)
            $signableParams = [
                'transid' => $transid,
                'amount'  => (string) $amount,
                'msisdn'  => $phone,
                'vendor'  => $vendorId,
            ];

            $headers = $this->computeSelcomHeaders($signableParams, $apiKey, $apiSecret);

            // Full request body for checkout/wallet-payment endpoint
            $body = array_merge($signableParams, [
                'name'     => $validated['customer_name'],
                'msisdn'   => $phone,
                'channel'  => $provider,
            ]);

            Log::info('Selcom USSD push request', [
                'body' => $body, 
                'headers_debug' => $headers,
                'vendor_id' => $vendorId,
                'api_key_used' => $apiKey,
                'base_url' => $baseUrl
            ]);

            $response = Http::withHeaders(array_merge([
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
                'X-Oweru-App-Key' => env('OWERU_APP_KEY'), // Add Oweru app key as header
            ], $headers))->post($baseUrl . '/checkout/wallet-payment', $body);

            Log::info('Selcom response', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'successful' => $response->successful(),
                'headers' => $response->headers(),
            ]);

            if ($response->successful()) {
                $result = $response->json();
                return response()->json([
                    'success' => true,
                    'data'    => [
                        'transaction_id' => $result['transid'] ?? $result['data']['transid'] ?? $transid,
                        'order_id'       => $transid,
                        'status'         => 'pending',
                    ],
                    'message' => 'Payment initiated successfully',
                ]);
            }

            if (app()->environment('local')) {
                return response()->json([
                    'success' => true,
                    'data'    => ['transaction_id' => 'DEV_' . uniqid(), 'order_id' => $transid, 'status' => 'pending'],
                    'message' => 'Dev mode – payment simulated',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment initiation failed: ' . $response->body(),
            ], $response->status());

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'error' => 'VALIDATION_ERROR', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Payment error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function handleWebhook(Request $request)
    {
        Log::info('Selcom webhook received', $request->all());
        return response()->json(['status' => 'received']);
    }
}