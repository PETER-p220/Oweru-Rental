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
     *
     * Selcom requires:
     *   - Timestamp: strict ISO 8601 UTC  →  2026-04-13T19:27:14Z
     *   - Authorization: "SELCOM " + Base64(apiKey)
     *   - Digest: Base64(HMAC-SHA256("timestamp={ts}&field1=val1&...", apiSecret))
     *   - Signed-Fields must list exactly the fields included in the digest, in order
     */
    private function computeSelcomHeaders(array $params, string $apiKey, string $apiSecret): array
    {
        // ✅ Strict ISO 8601 UTC — Selcom rejects anything else (e.g. "2026-13-04 19:22:27")
        $timestamp = gmdate('Y-m-d\TH:i:s\Z');

        // Fields to sign — order must match Signed-Fields header
        $signedFields = 'transid,amount,msisdn,vendor';

        // Build sign string: "timestamp={ts}&transid={v}&amount={v}&msisdn={v}&vendor={v}"
        $signData = "timestamp={$timestamp}";
        foreach (explode(',', $signedFields) as $field) {
            $signData .= "&{$field}=" . $params[$field];
        }

        // HMAC-SHA256 → raw binary → Base64
        $digest = base64_encode(hash_hmac('sha256', $signData, $apiSecret, true));

        // Authorization = "SELCOM " + Base64(apiKey)
        $authorization = base64_encode($apiKey);

        return [
            'Authorization' => "SELCOM {$authorization}",
            'Digest-Method' => 'HS256',
            'Digest'        => $digest,
            'Timestamp'     => $timestamp,   // ✅ e.g. 2026-04-13T19:27:14Z
            'Signed-Fields' => $signedFields,
        ];
    }

    /**
     * Map provider strings from frontend to Selcom channel names.
     */
    private function mapProviderForSelcom(string $provider): string
    {
        $map = [
            'TIGO'   => 'TIGOPESA',
            'MPESA'  => 'MPESA',
            'AIRTEL' => 'AIRTEL',
            'HALOPESA' => 'HALOPESA',
        ];

        $upper = strtoupper(trim($provider));

        if (!isset($map[$upper])) {
            throw new \Exception("Unsupported payment provider: {$provider}");
        }

        return $map[$upper];
    }

    /**
     * Normalize phone to 255XXXXXXXXX format.
     */
    private function normalizePhone(string $phone): string
    {
        // Strip all non-digits
        $phone = preg_replace('/\D/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '255' . substr($phone, 1);        // 07... → 2557...
        }

        if (!str_starts_with($phone, '255')) {
            return '255' . $phone;                   // 7... → 2557...
        }

        return $phone;                               // already 255...
    }

    /**
     * Initiate a mobile money USSD push via Selcom.
     *
     * POST /api/payment/initiate
     */
    public function initiateMobileMoney(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount'         => 'required|numeric|min:1000',
                'phone_number'   => 'required|string|min:10|max:13',
                'provider'       => 'required|in:TIGO,MPESA,AIRTEL,HALOPESA',
                'customer_email' => 'required|email',
                'customer_name'  => 'required|string|max:100',
                'order_id'       => 'required|string|max:50',
                'payment_type'   => 'required|string',
                'property_id'    => 'required|integer',
                'tenant_id'      => 'required|integer',
            ]);

            // ── Selcom credentials from .env ──────────────────────────────────────
            $vendorId  = config('services.selcom.vendor_id')  ?? env('SELCOM_VENDOR_ID');
            $apiKey    = config('services.selcom.api_key')    ?? env('SELCOM_API_KEY');
            $apiSecret = config('services.selcom.api_secret') ?? env('SELCOM_API_SECRET');
            $baseUrl   = config('services.selcom.base_url')   ?? env('SELCOM_BASE_URL', 'https://apigw.selcommobile.com/v1');

            if (empty($vendorId) || empty($apiKey) || empty($apiSecret)) {
                Log::error('Selcom credentials missing from environment');
                return response()->json([
                    'success' => false,
                    'message' => 'Payment gateway not configured.',
                ], 500);
            }

            // ── Prepare values ────────────────────────────────────────────────────
            $phone    = $this->normalizePhone($validated['phone_number']);
            $amount   = (string) (int) $validated['amount'];   // Selcom expects string integer
            $transid  = $validated['order_id'];
            $channel  = $this->mapProviderForSelcom($validated['provider']);

            // ── Signable params (must match Signed-Fields exactly) ────────────────
            $signableParams = [
                'transid' => $transid,
                'amount'  => $amount,
                'msisdn'  => $phone,
                'vendor'  => $vendorId,
            ];

            $headers = $this->computeSelcomHeaders($signableParams, $apiKey, $apiSecret);

            // ── Request body ──────────────────────────────────────────────────────
            // Fields must include everything in signableParams plus extra fields.
            // Do NOT add extra fields to the digest — only the ones in Signed-Fields.
            $body = [
                'transid' => $transid,
                'amount'  => $amount,
                'msisdn'  => $phone,
                'vendor'  => $vendorId,
                'name'    => $validated['customer_name'],
                'channel' => $channel,
            ];

            Log::info('Selcom USSD push request', [
                'body'          => $body,
                'headers_debug' => $headers,
                'vendor_id'     => $vendorId,
                'api_key_used'  => $apiKey,
                'base_url'      => $baseUrl,
            ]);

            // ── Fire the request ──────────────────────────────────────────────────
            $response = Http::withHeaders(array_merge(
                ['Content-Type' => 'application/json', 'Accept' => 'application/json'],
                $headers
            ))->post($baseUrl . '/checkout/wallet-payment', $body);

            Log::info('Selcom response', [
                'status'     => $response->status(),
                'body'       => $response->body(),
                'successful' => $response->successful(),
            ]);

            // ── Handle Selcom result ──────────────────────────────────────────────
            if ($response->successful()) {
                $result     = $response->json();
                $resultCode = $result['resultcode'] ?? null;

                // Selcom returns HTTP 200 even for business failures — check resultcode
                if ($resultCode !== '000' && $resultCode !== '200') {
                    Log::warning('Selcom business error', [
                        'resultcode' => $resultCode,
                        'message'    => $result['message'] ?? 'Unknown error',
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => $result['message'] ?? 'Payment initiation failed.',
                        'code'    => $resultCode,
                    ], 422);
                }

                return response()->json([
                    'success' => true,
                    'data'    => [
                        'transaction_id' => $result['transid'] ?? $transid,
                        'reference'      => $result['reference'] ?? null,
                        'order_id'       => $transid,
                        'status'         => 'pending',
                    ],
                    'message' => 'Payment initiated — please complete on your phone.',
                ]);
            }

            // ── Non-2xx HTTP response ─────────────────────────────────────────────
            Log::error('Selcom HTTP error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            // Dev/local fallback
            if (app()->environment('local')) {
                return response()->json([
                    'success' => true,
                    'data'    => [
                        'transaction_id' => 'DEV_' . uniqid(),
                        'order_id'       => $transid,
                        'status'         => 'pending',
                    ],
                    'message' => '[DEV] Payment simulated',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment gateway error. Please try again.',
                'detail'  => $response->body(),
            ], 502);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error'   => 'VALIDATION_ERROR',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Payment initiation exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred.',
            ], 500);
        }
    }

    /**
     * Handle Selcom payment callback / webhook.
     *
     * POST /api/payment/webhook
     *
     * Selcom sends result after the customer completes or cancels on their phone.
     * Verify the digest before trusting the payload.
     */
    public function handleWebhook(Request $request)
    {
        Log::info('Selcom webhook received', $request->all());

        // ── Verify webhook signature ──────────────────────────────────────────
        $apiSecret      = config('services.selcom.api_secret') ?? env('SELCOM_API_SECRET');
        $incomingDigest = $request->header('Digest');
        $timestamp      = $request->header('Timestamp');
        $signedFields   = $request->header('Signed-Fields');

        if ($incomingDigest && $timestamp && $signedFields) {
            $signData = "timestamp={$timestamp}";
            foreach (explode(',', $signedFields) as $field) {
                $signData .= "&{$field}=" . $request->input($field, '');
            }

            $expectedDigest = base64_encode(hash_hmac('sha256', $signData, $apiSecret, true));

            if (!hash_equals($expectedDigest, $incomingDigest)) {
                Log::warning('Selcom webhook signature mismatch', [
                    'expected' => $expectedDigest,
                    'received' => $incomingDigest,
                ]);
                return response()->json(['status' => 'invalid_signature'], 401);
            }
        }

        // ── Process the result ────────────────────────────────────────────────
        $resultCode = $request->input('resultcode');
        $transid    = $request->input('transid');
        $reference  = $request->input('reference');

        if ($resultCode === '000') {
            // ✅ Payment successful
            Log::info('Selcom payment confirmed', [
                'transid'   => $transid,
                'reference' => $reference,
            ]);

            // TODO: update your payments table here, e.g.:
            // Payment::where('order_id', $transid)->update(['status' => 'paid', 'reference' => $reference]);

        } else {
            // ❌ Payment failed / cancelled
            Log::warning('Selcom payment not successful', [
                'transid'    => $transid,
                'resultcode' => $resultCode,
                'message'    => $request->input('message'),
            ]);

            // TODO: update your payments table here, e.g.:
            // Payment::where('order_id', $transid)->update(['status' => 'failed']);
        }

        // Selcom expects a 200 OK acknowledgement
        return response()->json(['status' => 'received'], 200);
    }
}