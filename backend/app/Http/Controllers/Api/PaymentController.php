<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Initiate Selcom mobile money payment
     */
    public function initiateMobileMoney(Request $request)
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:1000',
                'phone_number' => 'required|string|min:10|max:13',
                'provider' => 'required|in:TIGO,MPESA,AIRTEL,HALOTEL',
                'customer_email' => 'required|email',
                'customer_name' => 'required|string',
                'order_id' => 'required|string',
                'payment_type' => 'required|string',
                'property_id' => 'required|integer',
                'tenant_id' => 'required|integer'
            ], [
                'phone_number.regex' => 'Phone number must be in format 2557xxxxxx or 07xxxxxx (Tanzania numbers only)',
                'amount.min' => 'Minimum amount is 100 TZS',
                'provider.in' => 'Provider must be TIGO, MPESA, AIRTEL, or HALOTEL'
            ]);

            // Selcom API credentials from environment
            $vendorId = env('SELCOM_VENDOR_ID');
            $apiKey = env('SELCOM_API_KEY');
            $apiSecret = env('SELCOM_API_SECRET');
            $baseUrl = env('SELCOM_BASE_URL', 'https://apigw.selcommobile.com/v1');
            
            // Generate signature for Selcom API
            $timestamp = time();
            $signatureData = $validated['order_id'] . $validated['amount'] . $timestamp;
            $signature = hash_hmac('sha256', $signatureData, $apiSecret);
            
            // Prepare Selcom API request
            $selcomData = [
                'amount' => $validated['amount'],
                'currency' => 'TZS',
                'vendor_id' => $vendorId,
                'order_id' => $validated['order_id'],
                'phone_number' => $validated['phone_number'],
                'provider' => $validated['provider'],
                'customer_email' => $validated['customer_email'],
                'customer_name' => $validated['customer_name'],
                'webhook_url' => url('/api/payment/webhook'),
                'redirect_url' => url('/payment/success')
            ];

            Log::info('Initiating Selcom payment', $selcomData);

            // Make request to Selcom API
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-API-Key' => $apiKey,
                'X-Vendor-ID' => $vendorId,
                'X-Timestamp' => $timestamp,
                'X-Signature' => $signature,
            ])->post($baseUrl . '/payments/mobilemoney', $selcomData);

            Log::info('Selcom API response', [
                'status' => $response->status(),
                'body' => $response->json()
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'transaction_id' => $result['data']['transaction_id'] ?? $validated['order_id'],
                        'order_id' => $validated['order_id'],
                        'status' => 'pending'
                    ],
                    'message' => 'Payment initiated successfully'
                ]);
            } else {
                // For development, return a mock successful response
                if (app()->environment('local')) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'transaction_id' => 'DEV_' . uniqid(),
                            'order_id' => $validated['order_id'],
                            'status' => 'pending'
                        ],
                        'message' => 'Development mode - Payment simulated'
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Payment initiation failed: ' . $response->body()
                ], $response->status());
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Payment validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'VALIDATION_ERROR',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Payment initiation error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment processing error: ' . $e->getMessage()
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
