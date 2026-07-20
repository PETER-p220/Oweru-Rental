<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentSplitService
{
    /**
     * Site visit fee: 50% Oweru, 50% agent (configurable via SITE_VISIT_* env).
     */
    public function processSiteVisitSplit(Payment $payment): void
    {
        if ($payment->type !== 'site_visit') {
            return;
        }

        if ($payment->metadata['payment_split'] ?? false) {
            return;
        }

        try {
            $property = Property::find($payment->property_id);
            if (! $property?->agent_id) {
                Log::warning('Site visit split skipped: no agent on property', ['payment_id' => $payment->id]);

                return;
            }

            $recipient = User::find($property->agent_id);
            $adminPhone = config('services.oweru.admin_phone');

            if (! $recipient?->phone || ! $adminPhone) {
                Log::error('Site visit split skipped: missing agent or admin phone', [
                    'payment_id' => $payment->id,
                    'agent_id' => $property->agent_id,
                ]);

                return;
            }

            $totalAmount = (float) $payment->amount;
            $oweruShare = (float) config('services.site_visit.oweru_share', 0.5);
            $agentShare = (float) config('services.site_visit.agent_share', 0.5);
            $adminAmount = round($totalAmount * $oweruShare);
            $recipientAmount = round($totalAmount * $agentShare);

            $baseUrl = rtrim((string) config('services.oweru.checkout_url', 'https://api.selcom.oweru.com/api/checkout'), '/');
            $appKey = config('services.oweru.app_key');

            if (! $appKey) {
                Log::error('Missing payment app key for site visit split');

                return;
            }

            $metadata = $payment->metadata ?? [];
            $provider = $metadata['provider'] ?? strtoupper((string) ($metadata['payment_method'] ?? 'TIGO'));

            $this->initiateSplitPayment($payment, $adminAmount, $adminPhone, 'admin', $provider, $baseUrl, $appKey);
            $this->initiateSplitPayment($payment, $recipientAmount, $recipient->phone, 'agent', $provider, $baseUrl, $appKey);

            $payment->update([
                'metadata' => array_merge($metadata, [
                    'payment_split' => true,
                    'split_processed_at' => now()->toIso8601String(),
                    'admin_amount' => $adminAmount,
                    'recipient_amount' => $recipientAmount,
                    'recipient_type' => 'agent',
                    'listing_type' => 'site_visit',
                    'split_model' => '50_50_test',
                ]),
            ]);

            Log::info('Site visit payment split processed', [
                'payment_id' => $payment->id,
                'total_amount' => $totalAmount,
                'admin_amount' => $adminAmount,
                'agent_amount' => $recipientAmount,
            ]);
        } catch (\Exception $e) {
            Log::error('Site visit payment splitting failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process payment splitting for first month rent.
     */
    public function processPaymentSplit(Payment $payment): void
    {
        if ($payment->type !== 'first_month_rent') {
            return;
        }

        if ($payment->metadata['payment_split'] ?? false) {
            return;
        }

        try {
            $adminPhone = config('services.oweru.admin_phone');
            $property = Property::find($payment->property_id);

            if (! $property) {
                Log::error('Cannot split payment: property not found', [
                    'payment_id' => $payment->id,
                    'property_id' => $payment->property_id,
                ]);

                return;
            }

            if ($property->agent_id) {
                $recipient = User::find($property->agent_id);
                $recipientType = 'agent';
                $recipientId = $property->agent_id;
            } elseif ($property->owner_id) {
                $recipient = User::find($property->owner_id);
                $recipientType = 'landlord';
                $recipientId = $property->owner_id;
            } else {
                Log::error('Cannot split payment: no agent or owner found', [
                    'payment_id' => $payment->id,
                    'property_id' => $payment->property_id,
                ]);

                return;
            }

            if (! $recipient || ! $recipient->phone) {
                Log::error("Cannot split payment: {$recipientType} phone not found", [
                    'payment_id' => $payment->id,
                    "{$recipientType}_id" => $recipientId,
                ]);

                return;
            }

            if (! $adminPhone) {
                Log::error('Cannot split payment: admin phone not configured');

                return;
            }

            $metadata = $payment->metadata ?? [];
            $monthlyRent = (float) ($metadata['monthly_rent'] ?? 0);
            $totalAmount = (float) $payment->amount;

            if ($property->agent_id) {
                $adminAmount = (float) ($metadata['oweru_fee'] ?? ($totalAmount * (float) config('services.rent_fees.agent_oweru_share', 0.30)));
                $recipientAmount = (float) ($metadata['recipient_amount'] ?? ($totalAmount * (float) config('services.rent_fees.agent_recipient_share', 0.70)));
            } else {
                // Landlord receives full monthly rent; Oweru initial fee is a separate charge.
                $monthlyRent = $monthlyRent > 0
                    ? $monthlyRent
                    : (float) ($metadata['tenant_rent_to_landlord'] ?? ($totalAmount / 2));
                $adminAmount = (float) ($metadata['oweru_initial_fee'] ?? $metadata['oweru_fee'] ?? $monthlyRent);
                $recipientAmount = (float) ($metadata['tenant_rent_to_landlord'] ?? $metadata['recipient_amount'] ?? $monthlyRent);
            }

            $baseUrl = rtrim((string) config('services.oweru.checkout_url', 'https://api.selcom.oweru.com/api/checkout'), '/');
            $appKey = config('services.oweru.app_key');

            if (! $appKey) {
                Log::error('Missing payment app key for payment splitting — set OWERU_APP_KEY and refresh config cache');

                return;
            }

            $provider = $metadata['provider'] ?? 'TIGO';

            $this->initiateSplitPayment($payment, $adminAmount, $adminPhone, 'admin', $provider, $baseUrl, $appKey);
            $this->initiateSplitPayment($payment, $recipientAmount, $recipient->phone, $recipientType, $provider, $baseUrl, $appKey);

            $payment->update([
                'metadata' => array_merge($metadata, [
                    'payment_split' => true,
                    'split_processed_at' => now()->toIso8601String(),
                    'admin_amount' => $adminAmount,
                    'recipient_amount' => $recipientAmount,
                    'recipient_type' => $recipientType,
                    'listing_type' => $property->agent_id ? 'agent' : 'owner',
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

        $createPayload = [
            'order_id' => $splitOrderId,
            'buyer_name' => $recipientType === 'admin' ? 'Oweru Admin' : 'Recipient Payment',
            'buyer_email' => $recipientType === 'admin' ? 'admin@oweru.com' : 'recipient@oweru.com',
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

            $payPayload = [
                'order_id' => $splitOrderId,
                'transid' => $splitOrderId,
                'msisdn' => $phone,
                'provider' => $selcomProvider,
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

    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '255' . substr($phone, 1);
        }
        if (! str_starts_with($phone, '255')) {
            return '255' . $phone;
        }

        return $phone;
    }
}
