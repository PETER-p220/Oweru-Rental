<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Application;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentProcessingService
{
    private $rentalWorkflowService;

    public function __construct(RentalWorkflowService $rentalWorkflowService)
    {
        $this->rentalWorkflowService = $rentalWorkflowService;
    }

    /**
     * Initiate mobile money payment via Selcom
     */
    public function initiateMobileMoneyPayment(
        Application $application,
        string $phoneNumber,
        float $amount,
        string $paymentType = 'first_month_rent'
    ): array {
        try {
            // Validate phone number
            $phoneNumber = $this->sanitizePhoneNumber($phoneNumber);

            // Call Selcom API to initiate payment
            $response = $this->callSelcomAPI([
                'amount' => $amount,
                'phone_number' => $phoneNumber,
                'merchant_reference' => 'RENT-' . $application->id . '-' . time(),
                'payment_type' => $paymentType,
            ]);

            if ($response['success']) {
                // Create pending payment record
                $payment = Payment::create([
                    'user_id' => $application->user_id,
                    'property_id' => $application->property_id,
                    'agent_id' => $application->property->agent_id,
                    'type' => $paymentType,
                    'amount' => $amount,
                    'status' => 'pending',
                    'reference' => $response['reference'],
                    'metadata' => [
                        'phone_number' => $phoneNumber,
                        'payment_method' => 'selcom_mobile_money',
                        'selcom_transaction_id' => $response['transaction_id'] ?? null,
                    ],
                ]);

                return [
                    'success' => true,
                    'payment_id' => $payment->id,
                    'reference' => $response['reference'],
                    'message' => 'Payment initiated. Please check your phone for payment prompt.',
                ];
            }

            return [
                'success' => false,
                'message' => $response['message'] ?? 'Failed to initiate payment',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verify payment status
     */
    public function verifyPaymentStatus(Payment $payment): void
    {
        try {
            $reference = $payment->reference;
            $response = $this->checkSelcomPaymentStatus($reference);

            if ($response['success'] && $response['paid']) {
                $this->completePayment($payment, $response);
            }
        } catch (\Exception $e) {
            // Log error but don't fail
            \Log::error('Payment verification failed', ['payment_id' => $payment->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Handle payment webhook from Selcom
     */
    public function handlePaymentWebhook(array $webhookData): void
    {
        DB::transaction(function () use ($webhookData) {
            \Log::info('Payment webhook received', $webhookData);

            // Find payment by reference
            $payment = Payment::where('reference', $webhookData['merchant_transaction_id'] ?? null)
                ->orWhere('reference', $webhookData['reference'] ?? null)
                ->orWhere('reference', $webhookData['merchant_reference'] ?? null)
                ->first();

            if (!$payment) {
                // Try finding by selcom transaction ID in metadata
                $payment = Payment::whereJsonContains(
                    'metadata->selcom_transaction_id',
                    $webhookData['transaction_id'] ?? null
                )->first();
            }

            if (!$payment) {
                \Log::warning('Payment webhook received for unknown payment', $webhookData);
                return;
            }

            // Verify webhook signature
            if (!$this->verifyWebhookSignature($webhookData)) {
                \Log::warning('Invalid webhook signature for payment', ['payment_id' => $payment->id]);
                return;
            }

            // Check Selcom response format
            $isCompleted = $this->isPaymentCompleted($webhookData);
            $isFailed = $this->isPaymentFailed($webhookData);

            if ($isCompleted) {
                $this->completePayment($payment, $webhookData);
            } elseif ($isFailed) {
                $payment->update(['status' => 'failed']);
                \Log::info('Payment marked as failed', ['payment_id' => $payment->id]);
            } else {
                \Log::info('Payment webhook with status: ' . ($webhookData['status'] ?? 'unknown'));
            }
        });
    }

    /**
     * Check if payment is completed based on Selcom response
     */
    private function isPaymentCompleted(array $data): bool
    {
        // Check various Selcom response formats
        return ($data['status'] ?? null) === 'completed'
            || ($data['status'] ?? null) === 'success'
            || ($data['paid'] ?? false) === true
            || ($data['is_paid'] ?? false) === true
            || ($data['result'] ?? null) === 'SUCCESS';
    }

    /**
     * Check if payment failed based on Selcom response
     */
    private function isPaymentFailed(array $data): bool
    {
        return ($data['status'] ?? null) === 'failed'
            || ($data['status'] ?? null) === 'cancelled'
            || ($data['status'] ?? null) === 'error'
            || ($data['result'] ?? null) === 'FAILED';
    }

    /**
     * Complete payment and trigger workflow
     */
    private function completePayment(Payment $payment, array $paymentData): void
    {
        if (in_array($payment->status, ['completed', 'paid'], true) && $payment->paid_at) {
            return;
        }

        DB::transaction(function () use ($payment, $paymentData) {
            // Update payment status
            $payment->update([
                'status' => 'completed',
                'paid_at' => now(),
                'metadata' => array_merge($payment->metadata ?? [], [
                    'verified_at' => now()->toIso8601String(),
                    'verification_data' => $paymentData,
                ]),
            ]);

            if ($payment->type === 'first_month_rent') {
                // Find the application
                $application = Application::where('user_id', $payment->user_id)
                    ->where('property_id', $payment->property_id)
                    ->first();

                if ($application) {
                    // Allocate commissions
                    if ($application->property->agent_id) {
                        $this->rentalWorkflowService->allocateCommission($payment);
                    }

                    // Update application status
                    $application->update([
                        'payment_status' => 'completed',
                        'workflow_status' => 'payment_completed',
                    ]);
                }
            }

            app(PaymentAlertService::class)->handleMonthlyPaymentCompleted($payment->fresh(['property', 'user']));

            // Trigger payment splitting for first month rent
            if ($payment->type === 'first_month_rent') {
                try {
                    $paymentController = app(\App\Http\Controllers\Api\PaymentController::class);
                    $paymentController->processPaymentSplit($payment);
                } catch (\Exception $e) {
                    Log::error('Failed to process payment split', [
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });
    }

    /**
     * Call Selcom API to initiate payment via USSD push
     */
    private function callSelcomAPI(array $data): array
    {
        try {
            $appKey = config('services.oweru.app_key');
            $vendorId = config('services.selcom.vendor_id');
            $apiKey = config('services.selcom.api_key');
            $baseUrl = config('services.selcom.base_url');

            if (!$appKey || !$vendorId || !$apiKey) {
                throw new \Exception('Missing Selcom API configuration');
            }

            // Normalize phone number
            $phone = $this->sanitizePhoneNumber($data['phone_number']);

            // Prepare payload for Selcom USSD push
            $payload = [
                'app_key' => $appKey,
                'vendor_id' => $vendorId,
                'phone' => $phone,
                'amount' => (int) $data['amount'],
                'reference' => $data['merchant_reference'],
                'merchant_name' => 'Oweru Rental',
                'merchant_transaction_id' => $data['merchant_reference'],
                'description' => 'Oweru Rental - ' . $data['payment_type'],
                'currency' => 'TZS',
                'callback_url' => route('payment.webhook'),
            ];

            \Log::info('Selcom USSD Push Request', [
                'reference' => $data['merchant_reference'],
                'amount' => $data['amount'],
                'phone' => $phone,
            ]);

            // Call Selcom USSD push API
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'X-API-Key' => $apiKey,
            ])->timeout(30)->post($baseUrl . '/ussd/initiate', $payload);

            $responseData = $response->json();

            \Log::info('Selcom USSD Push Response', [
                'status' => $response->status(),
                'response' => $responseData,
            ]);

            if ($response->successful() && isset($responseData['status']) && $responseData['status'] === 'success') {
                return [
                    'success' => true,
                    'reference' => $data['merchant_reference'],
                    'transaction_id' => $responseData['transaction_id'] ?? 'TXN-' . time(),
                    'message' => 'Payment initiated successfully',
                    'selcom_reference' => $responseData['reference'] ?? null,
                ];
            }

            // Handle alternative response format
            if ($response->successful() && isset($responseData['result']) && $responseData['result'] === 'SUCCESS') {
                return [
                    'success' => true,
                    'reference' => $data['merchant_reference'],
                    'transaction_id' => $responseData['transaction_id'] ?? 'TXN-' . time(),
                    'message' => 'Payment initiated successfully',
                ];
            }

            return [
                'success' => false,
                'message' => $responseData['message'] ?? 'Selcom API error: ' . ($responseData['error'] ?? 'Unknown error'),
            ];
        } catch (\Exception $e) {
            \Log::error('Selcom API Error', [
                'error' => $e->getMessage(),
                'reference' => $data['merchant_reference'] ?? 'unknown',
            ]);

            return [
                'success' => false,
                'message' => 'Payment service error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check Selcom payment status
     */
    private function checkSelcomPaymentStatus(string $reference): array
    {
        try {
            $apiKey = config('services.selcom.api_key');
            $vendorId = config('services.selcom.vendor_id');
            $baseUrl = config('services.selcom.base_url');

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'X-API-Key' => $apiKey,
            ])->timeout(30)->get($baseUrl . '/transaction/status', [
                'vendor_id' => $vendorId,
                'merchant_transaction_id' => $reference,
            ]);

            $data = $response->json();

            if ($response->successful() && isset($data['status'])) {
                return [
                    'success' => true,
                    'paid' => $data['status'] === 'completed',
                    'status' => $data['status'],
                    'data' => $data,
                ];
            }

            return [
                'success' => false,
                'paid' => false,
            ];
        } catch (\Exception $e) {
            \Log::error('Selcom Status Check Error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'paid' => false,
            ];
        }
    }

    /**
     * Verify webhook signature from Selcom
     */
    private function verifyWebhookSignature(array $data): bool
    {
        try {
            $apiSecret = config('services.selcom.api_secret');
            
            if (!$apiSecret) {
                \Log::warning('Selcom API Secret not configured');
                return true; // Allow if not configured (development)
            }

            // Selcom includes signature in headers or payload
            // Typical implementation: hash(payload + secret)
            $expectedSignature = hash_hmac(
                'sha256',
                json_encode($data),
                $apiSecret
            );

            $providedSignature = $data['signature'] ?? request()->header('X-Signature');

            if (!$providedSignature) {
                \Log::warning('No signature provided in webhook');
                return true; // Development mode
            }

            $isValid = hash_equals($expectedSignature, $providedSignature);

            if (!$isValid) {
                \Log::warning('Invalid webhook signature', [
                    'expected' => $expectedSignature,
                    'provided' => $providedSignature,
                ]);
            }

            return $isValid;
        } catch (\Exception $e) {
            \Log::error('Webhook signature verification error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Sanitize phone number
     */
    private function sanitizePhoneNumber(string $phoneNumber): string
    {
        // Remove spaces and special characters
        $cleaned = preg_replace('/\D/', '', $phoneNumber);

        // Handle different Africa phone number formats
        if (str_starts_with($cleaned, '255')) {
            return $cleaned;
        } elseif (str_starts_with($cleaned, '0')) {
            return '255' . substr($cleaned, 1);
        } else {
            return '255' . $cleaned;
        }
    }

    /**
     * Calculate total amount due (rent + service charge)
     */
    public function calculateTotalDue(Application $application): float
    {
        $rent = $application->offered_rent ?? $application->property->price;
        $serviceCharge = $application->service_charge ?? 0;

        return (float) ($rent + $serviceCharge);
    }

    /**
     * Get pending payments for user
     */
    public function getPendingPayments(int $userId): array
    {
        return Payment::where('user_id', $userId)
            ->where('status', 'pending')
            ->where('due_date', '>=', now()->subDay())
            ->with('property', 'tenant')
            ->orderBy('due_date')
            ->get()
            ->toArray();
    }
}
