<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\PaymentProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Normalize phone to 255XXXXXXXXX format.
     */
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

    /**
     * Initiate a mobile money USSD push via Oweru → Selcom.
     *
     * Uses the same 2-step approach that works in CheckoutController:
     *   Step 1: POST /checkout/create-order-minimal
     *   Step 2: POST /checkout/wallet-payment
     *
     * POST /api/payment/selcom/mobile-money
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

            $appKey  = env('OWERU_APP_KEY');
            $baseUrl = 'https://api.selcom.oweru.com/api/checkout';

            if (empty($appKey)) {
                Log::error('Missing OWERU_APP_KEY in .env');
                return response()->json([
                    'success' => false,
                    'message' => 'Payment service not configured.',
                ], 500);
            }

            $phone   = $this->normalizePhone($validated['phone_number']);
            $amount  = number_format((int) $validated['amount'], 0, '.', '');
            $orderId = $validated['order_id'];

            // ── Step 1: Create order ──────────────────────────────────────────────
            $createPayload = [
                'order_id'         => $orderId,
                'buyer_name'       => trim($validated['customer_name']),
                'buyer_email'      => trim($validated['customer_email']),
                'buyer_phone'      => $phone,
                'amount'           => $amount,
                'currency'         => 'TZS',
                'buyer_remarks'    => $validated['payment_type'],
                'merchant_remarks' => 'Oweru Rental - ' . $validated['payment_type'],
                'no_of_items'      => 1,
            ];

            Log::info('Oweru create-order-minimal request', [
                'payload' => $createPayload,
            ]);

            $createResponse = Http::withHeaders([
                'X-App-Key'    => $appKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])->post($baseUrl . '/create-order-minimal', $createPayload);

            Log::info('Oweru create-order-minimal response', [
                'status' => $createResponse->status(),
                'body'   => $createResponse->body(),
            ]);

            $createData = $createResponse->json();

            if (!$createResponse->successful() || ($createData['result'] ?? '') !== 'SUCCESS') {
                $errorDetail = $createData['detail']
                    ?? $createData['message']
                    ?? $createData['error']
                    ?? $createResponse->body()
                    ?: 'Unknown error from Oweru';

                Log::error('Oweru create-order-minimal failed', [
                    'status' => $createResponse->status(),
                    'detail' => $errorDetail,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Could not create payment order: ' . $errorDetail,
                ], 422);
            }

            // ── Step 2: Trigger USSD push ─────────────────────────────────────────
            $payPayload = [
                'order_id' => $orderId,
                'transid'  => $orderId,
                'msisdn'   => $phone,
            ];

            Log::info('Oweru wallet-payment request', [
                'payload' => $payPayload,
            ]);

            $payResponse = Http::withHeaders([
                'X-App-Key'    => $appKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])->post($baseUrl . '/wallet-payment', $payPayload);

            Log::info('Oweru wallet-payment response', [
                'status' => $payResponse->status(),
                'body'   => $payResponse->body(),
            ]);

            $payData = $payResponse->json();

            if (!$payResponse->successful()) {
                $errorDetail = $payData['detail']
                    ?? $payData['message']
                    ?? $payData['error']
                    ?? $payResponse->body()
                    ?: 'Payment trigger failed';

                Log::error('Oweru wallet-payment failed', [
                    'status' => $payResponse->status(),
                    'detail' => $errorDetail,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Payment request could not be sent: ' . $errorDetail,
                ], 422);
            }

            // ── Success ───────────────────────────────────────────────────────────
            return response()->json([
                'success' => true,
                'data'    => [
                    'transaction_id' => $orderId,
                    'order_id'       => $orderId,
                    'status'         => 'pending',
                ],
                'message' => 'Payment request sent to ' . $validated['phone_number'] . '. Please check your phone and approve the prompt.',
            ]);

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
     */
    public function handleWebhook(Request $request)
    {
        Log::info('Selcom webhook received', $request->all());

        $resultCode = $request->input('resultcode');
        $status     = strtoupper($request->input('status') ?? '');
        $transid    = $request->input('transid') ?? $request->input('order_id');
        $reference  = $request->input('reference') ?? $request->input('transaction_id');

        $isPaid = $resultCode === '000'
            || in_array($status, ['COMPLETED', 'SUCCESS', 'PAID']);

        if ($isPaid) {
            Log::info('Selcom payment confirmed via webhook', [
                'transid'   => $transid,
                'reference' => $reference,
            ]);
            
            // Use PaymentProcessingService to handle payment completion
            try {
                $paymentService = app(PaymentProcessingService::class);
                $paymentService->handlePaymentWebhook([
                    'merchant_transaction_id' => $transid,
                    'transaction_id' => $reference,
                    'status' => 'completed',
                    'paid' => true,
                    'result_code' => $resultCode,
                    'result_message' => $request->input('message'),
                ]);
            } catch (\Exception $e) {
                Log::error('Error processing payment webhook', ['error' => $e->getMessage()]);
            }
        } else {
            Log::warning('Selcom payment not successful via webhook', [
                'transid'    => $transid,
                'resultcode' => $resultCode,
                'status'     => $status,
                'message'    => $request->input('message'),
            ]);
            
            // Mark payment as failed
            try {
                $payment = Payment::where('reference', $transid)
                    ->orWhere('reference', $reference)
                    ->first();
                
                if ($payment) {
                    $payment->update(['status' => 'failed']);
                    Log::info('Payment marked as failed', ['payment_id' => $payment->id]);
                }
            } catch (\Exception $e) {
                Log::error('Error marking payment as failed', ['error' => $e->getMessage()]);
            }
        }

        return response()->json(['status' => 'received'], 200);
    }
}