<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Application;
use App\Services\PaymentProcessingService;
use App\Services\PaymentSplitService;
use App\Services\SelcomPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
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
                'amount'         => 'required|numeric|min:100',
                'phone_number'   => 'required|string|min:10|max:13',
                'provider'       => 'required|in:TIGO,MPESA,AIRTEL,HALOPESA,HALOPES,tigo,mpesa,airtel,halopesa',
                'customer_email' => 'required|email',
                'customer_name'  => 'required|string|max:100',
                'order_id'       => 'required|string|max:50',
                'payment_type'   => 'required|string',
                'property_id'    => 'required|integer',
                'tenant_id'      => 'required|integer',
            ]);

            $validated['provider'] = strtoupper($validated['provider']);

            $result = app(SelcomPaymentService::class)->initiate($validated);

            if (! $result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'] ?? 'Payment initiation failed.',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'data'    => $result['data'],
                'message' => $result['message'],
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
     * Process payment splitting for first month rent.
     */
    public function processPaymentSplit(Payment $payment): void
    {
        $splitter = app(PaymentSplitService::class);
        if ($payment->type === 'site_visit') {
            $splitter->processSiteVisitSplit($payment);

            return;
        }
        $splitter->processPaymentSplit($payment);
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
        $transid    = $request->input('transid')
            ?? $request->input('order_id')
            ?? $request->input('merchant_transaction_id');
        $reference  = $request->input('reference') ?? $request->input('transaction_id');
        $paymentStatus = strtoupper($request->input('payment_status') ?? '');

        $result = strtoupper($request->input('result') ?? '');
        $isPaid = $paymentStatus === 'COMPLETED'
            || $paymentStatus === 'PAID'
            || $paymentStatus === 'SUCCESSFUL'
            || ($resultCode === '000' && $paymentStatus === 'COMPLETED')
            || ($resultCode === '000' && $result === 'SUCCESS' && ! in_array($paymentStatus, ['PENDING', 'INPROGRESS', 'IN_PROGRESS', ''], true))
            || ($resultCode === '000' && in_array($status, ['COMPLETED', 'PAID'], true));

        if ($isPaid) {
            Log::info('Selcom payment confirmed via webhook', [
                'transid'   => $transid,
                'reference' => $reference,
            ]);

            if ($transid) {
                app(\App\Services\SiteVisitPaymentService::class)->confirmByOrderId($transid, $request->all());
                app(\App\Services\RentPaymentService::class)->confirmByOrderId($transid, $request->all());
                app(\App\Services\BnbPaymentService::class)->confirmByOrderId($transid, $request->all());
            }
            if ($reference && $reference !== $transid) {
                app(\App\Services\SiteVisitPaymentService::class)->confirmByOrderId((string) $reference, $request->all());
                app(\App\Services\RentPaymentService::class)->confirmByOrderId((string) $reference, $request->all());
                app(\App\Services\BnbPaymentService::class)->confirmByOrderId((string) $reference, $request->all());
            }
            
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

                // Find the completed payment and process splitting if it's first month rent
                $payment = Payment::where('reference', $transid)
                    ->orWhere('reference', $reference)
                    ->first();

                if ($payment && $payment->status === 'completed') {
                    $this->processPaymentSplit($payment);
                }

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

                if ($transid) {
                    Application::where('transaction_id', $transid)
                        ->where('payment_status', 'pending')
                        ->update(['payment_status' => 'failed']);

                    Application::where('rent_transaction_id', $transid)
                        ->where('rent_payment_status', 'pending')
                        ->update(['rent_payment_status' => 'failed']);

                    \App\Models\BnbBooking::where('transaction_id', $transid)
                        ->where('payment_status', 'pending')
                        ->update(['payment_status' => 'failed']);
                }
            } catch (\Exception $e) {
                Log::error('Error marking payment as failed', ['error' => $e->getMessage()]);
            }
        }

        return response()->json(['status' => 'received'], 200);
    }
}