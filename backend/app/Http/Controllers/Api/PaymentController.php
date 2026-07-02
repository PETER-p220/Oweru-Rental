<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use App\Services\PaymentProcessingService;
use App\Services\SelcomPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

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
     * Process payment splitting for first month rent
     * 30% to Oweru admin, 70% to agent
     */
    public function processPaymentSplit(Payment $payment): void
    {
        // Only split first month rent payments
        if ($payment->type !== 'first_month_rent') {
            return;
        }

        // Check if already split
        if ($payment->metadata['payment_split'] ?? false) {
            return;
        }

        try {
            $adminPhone = env('OWERU_ADMIN_PHONE');
            $property = Property::find($payment->property_id);
            
            if (!$property) {
                Log::error('Cannot split payment: property not found', [
                    'payment_id' => $payment->id,
                    'property_id' => $payment->property_id,
                ]);
                return;
            }

            // Handle agent properties
            if ($property->agent_id) {
                $recipient = User::find($property->agent_id);
                $recipientType = 'agent';
                $recipientId = $property->agent_id;
            }
            // Handle landlord properties  
            elseif ($property->owner_id) {
                $recipient = User::find($property->owner_id);
                $recipientType = 'landlord';
                $recipientId = $property->owner_id;
            }
            else {
                Log::error('Cannot split payment: no agent or owner found', [
                    'payment_id' => $payment->id,
                    'property_id' => $payment->property_id,
                ]);
                return;
            }

            if (!$recipient || !$recipient->phone) {
                Log::error("Cannot split payment: {$recipientType} phone not found", [
                    'payment_id' => $payment->id,
                    "{$recipientType}_id" => $recipientId,
                ]);
                return;
            }

            if (!$adminPhone) {
                Log::error('Cannot split payment: admin phone not configured');
                return;
            }

            $totalAmount = $payment->amount;
            $adminAmount = $totalAmount * 0.30; // 30%
            $recipientAmount = $totalAmount * 0.70; // 70%

            $baseUrl = 'https://api.selcom.oweru.com/api/checkout';
            $appKey = env('OWERU_APP_KEY');

            if (!$appKey) {
                Log::error('Missing OWERU_APP_KEY for payment splitting');
                return;
            }

            // Get provider from original payment metadata or default to TIGO
            $provider = $payment->metadata['provider'] ?? 'TIGO';

            // Process admin payment (30%)
            $this->initiateSplitPayment($payment, $adminAmount, $adminPhone, 'admin', $provider, $baseUrl, $appKey);

            // Process recipient payment (70%) - agent or landlord
            $this->initiateSplitPayment($payment, $recipientAmount, $recipient->phone, $recipientType, $provider, $baseUrl, $appKey);

            // Mark payment as split
            $payment->update([
                'metadata' => array_merge($payment->metadata ?? [], [
                    'payment_split' => true,
                    'split_processed_at' => now()->toIso8601String(),
                    'admin_amount' => $adminAmount,
                    'recipient_amount' => $recipientAmount,
                    'recipient_type' => $recipientType,
                    'admin_phone' => $adminPhone,
                    'recipient_phone' => $recipient->phone,
                ]),
            ]);

            Log::info('Payment split processed successfully', [
                'payment_id' => $payment->id,
                'total_amount' => $totalAmount,
                'admin_amount' => $adminAmount,
                'recipient_amount' => $recipientAmount,
                'recipient_type' => $recipientType,
            ]);

        } catch (\Exception $e) {
            Log::error('Payment splitting failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Initiate split payment to recipient
     */
    private function initiateSplitPayment(
        Payment $originalPayment,
        float $amount,
        string $phoneNumber,
        string $recipientType,
        string $provider,
        string $baseUrl,
        string $appKey
    ): void {
        $phone = $this->normalizePhone($phoneNumber);
        $amountFormatted = number_format((int) $amount, 0, '.', '');
        $splitOrderId = 'SPLIT-' . $originalPayment->id . '-' . $recipientType . '-' . time();

        // Create order for split payment
        $createPayload = [
            'order_id' => $splitOrderId,
            'buyer_name' => $recipientType === 'admin' ? 'Oweru Admin' : 'Agent Payment',
            'buyer_email' => $recipientType === 'admin' ? 'admin@oweru.com' : 'agent@oweru.com',
            'buyer_phone' => $phone,
            'amount' => $amountFormatted,
            'currency' => 'TZS',
            'buyer_remarks' => 'Payment split - ' . $recipientType,
            'merchant_remarks' => 'Oweru Rental Split - ' . $recipientType . ' for payment #' . $originalPayment->id,
            'no_of_items' => 1,
        ];

        Log::info('Initiating split payment', [
            'recipient_type' => $recipientType,
            'amount' => $amount,
            'phone' => $phone,
            'order_id' => $splitOrderId,
        ]);

        $createResponse = Http::withHeaders([
            'X-App-Key' => $appKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->post($baseUrl . '/create-order-minimal', $createPayload);

        if ($createResponse->successful()) {
            $selcomProvider = SelcomPaymentService::mapProvider($provider);
            
            // Trigger USSD push for split payment
            $payPayload = [
                'order_id' => $splitOrderId,
                'transid' => $splitOrderId,
                'msisdn' => $phone,
                'provider' => $selcomProvider, // Use mapped provider code
            ];

            $payResponse = Http::withHeaders([
                'X-App-Key' => $appKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post($baseUrl . '/wallet-payment', $payPayload);

            if ($payResponse->successful()) {
                Log::info('Split payment initiated successfully', [
                    'recipient_type' => $recipientType,
                    'amount' => $amount,
                    'phone' => $phone,
                    'order_id' => $splitOrderId,
                    'provider_used' => $selcomProvider,
                    'original_provider' => $provider,
                ]);
            }
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
            } catch (\Exception $e) {
                Log::error('Error marking payment as failed', ['error' => $e->getMessage()]);
            }
        }

        return response()->json(['status' => 'received'], 200);
    }
}