<?php

namespace App\Services;

use App\Mail\PaymentReceivedMail;
use App\Models\Application;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class PaymentAlertService
{
    /**
     * Persist a completed payment for tenant history (idempotent by reference).
     *
     * @param  array<string, mixed>  $extra
     */
    public function recordCompletedPayment(
        User $tenant,
        Property $property,
        float $amount,
        string $type,
        string $reference,
        string $description,
        array $extra = [],
    ): ?Payment {
        if (! Schema::hasTable('payments')) {
            return null;
        }

        $existing = Payment::where('reference', $reference)->first();
        if ($existing) {
            if (! in_array($existing->status, ['completed', 'paid'], true)) {
                $existing->update([
                    'status' => 'completed',
                    'paid_at' => $existing->paid_at ?? now(),
                    'amount' => $amount,
                    'description' => $description,
                    'metadata' => array_merge($existing->metadata ?? [], $extra, [
                        'confirmed_at' => now()->toIso8601String(),
                    ]),
                ]);
            }

            return $existing->fresh();
        }

        return Payment::create([
            'user_id' => $tenant->id,
            'property_id' => $property->id,
            'agent_id' => $property->agent_id,
            'type' => $type,
            'amount' => $amount,
            'status' => 'completed',
            'reference' => $reference,
            'description' => $description,
            'paid_at' => now(),
            'metadata' => array_merge($extra, [
                'confirmed_at' => now()->toIso8601String(),
            ]),
        ]);
    }

    /**
     * In-app + email alerts for landlord / agent / commercial owner (and optional tenant).
     *
     * @param  array{notify_tenant?:bool, tenant_title?:string, tenant_message?:string, tenant_type?:string}  $options
     */
    public function notifyStakeholders(
        Property $property,
        User $tenant,
        float $amount,
        string $paymentType,
        ?string $reference = null,
        array $options = [],
    ): void {
        $tenantName = trim(($tenant->first_name ?? '') . ' ' . ($tenant->last_name ?? ''))
            ?: ($tenant->email ?? 'A tenant');
        $propertyTitle = $property->title ?? 'a property';
        $amountLabel = number_format($amount);
        $typeLabel = $this->typeLabel($paymentType);
        $paidAt = now()->format('d M Y, H:i');

        $ownerTitle = "{$typeLabel} Received";
        $ownerMessage = "{$tenantName} paid TZS {$amountLabel} ({$typeLabel}) for {$propertyTitle}.";

        $recipientIds = array_values(array_unique(array_filter([
            $property->owner_id,
            $property->agent_id,
        ])));

        foreach ($recipientIds as $userId) {
            if ((int) $userId === (int) $tenant->id) {
                continue;
            }

            $recipient = User::find($userId);
            if (! $recipient) {
                continue;
            }

            try {
                Notification::create([
                    'user_id' => $recipient->id,
                    'title' => $ownerTitle,
                    'message' => $ownerMessage,
                    'type' => $paymentType,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to create stakeholder payment notification', [
                    'user_id' => $recipient->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $this->sendEmail($recipient, [
                'recipient_name' => trim(($recipient->first_name ?? '') . ' ' . ($recipient->last_name ?? ''))
                    ?: ($recipient->email ?? 'there'),
                'tenant_name' => $tenantName,
                'property_title' => $propertyTitle,
                'amount' => $amountLabel,
                'payment_type_label' => $typeLabel,
                'reference' => $reference,
                'paid_at' => $paidAt,
            ]);
        }

        if ($options['notify_tenant'] ?? false) {
            try {
                Notification::create([
                    'user_id' => $tenant->id,
                    'title' => $options['tenant_title'] ?? 'Payment Confirmed',
                    'message' => $options['tenant_message']
                        ?? "Your TZS {$amountLabel} payment for {$propertyTitle} was received successfully.",
                    'type' => $options['tenant_type'] ?? 'payment_confirmed',
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to create tenant payment notification', [
                    'user_id' => $tenant->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Record history + notify after application rent is confirmed.
     *
     * @param  array<string, mixed>  $feeBreakdown
     * @param  array<string, mixed>  $meta
     */
    public function handleRentPaid(Application $application, array $feeBreakdown = [], array $meta = []): void
    {
        $application->loadMissing('property', 'user');
        $property = $application->property;
        $tenant = $application->user;

        if (! $property || ! $tenant) {
            return;
        }

        if ($feeBreakdown === []) {
            $feeBreakdown = app(RentFeeService::class)->calculateFirstMonthFees($application);
        }

        $amount = (float) ($application->amount_paid ?? $feeBreakdown['total_charge'] ?? 0);
        $reference = (string) ($application->rent_transaction_id ?: ('RENT-APP-' . $application->id));
        $provider = strtoupper((string) ($application->rent_payment_method ?? $meta['provider'] ?? 'TIGO'));

        $paymentMonths = (int) ($feeBreakdown['payment_duration_months'] ?? 1);
        $periodLabel = $paymentMonths > 1 ? "{$paymentMonths}-month rent" : 'First month rent';

        $payment = $this->recordCompletedPayment(
            $tenant,
            $property,
            $amount,
            'first_month_rent',
            $reference,
            $periodLabel . ' — ' . ($property->title ?? 'Property'),
            [
                'application_id' => $application->id,
                'payment_method' => $application->rent_payment_method,
                'provider' => $provider,
                'source' => 'rent_payment_service',
                'months' => $paymentMonths,
                'rent_amount' => $feeBreakdown['monthly_rent'] ?? null,
                'monthly_rent' => $feeBreakdown['monthly_rent'] ?? null,
                'payment_duration_months' => $paymentMonths,
                'period_rent' => $feeBreakdown['period_rent'] ?? null,
                'tenant_rent_to_landlord' => $feeBreakdown['tenant_rent_to_landlord'] ?? null,
                'oweru_initial_fee' => $feeBreakdown['oweru_initial_fee'] ?? null,
                'oweru_fee' => $feeBreakdown['oweru_fee'] ?? null,
                'recipient_amount' => $feeBreakdown['recipient_amount'] ?? null,
                'listing_type' => $feeBreakdown['listing_type'] ?? null,
                'fee_breakdown' => $feeBreakdown,
            ],
        );

        if ($payment) {
            try {
                app(PaymentSplitService::class)->processPaymentSplit($payment);
            } catch (\Throwable $e) {
                Log::error('Failed to process first-month rent payment split', [
                    'payment_id' => $payment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->notifyStakeholders(
            $property,
            $tenant,
            $amount,
            'rent_paid',
            $reference,
            [
                'notify_tenant' => true,
                'tenant_title' => 'Rent Payment Confirmed',
                'tenant_message' => 'Your TZS ' . number_format($amount) .
                    ' rent payment for ' . ($property->title ?? 'your property') .
                    ' was received successfully. Check Rent Payments to pay additional months, and Digital Contracts for next steps.',
                'tenant_type' => 'rent_paid',
            ],
        );

        try {
            app(MonthlyRentService::class)->scheduleAfterApplicationRent($application);
        } catch (\Throwable $e) {
            Log::warning('Failed to schedule next monthly rent after first-month payment', [
                'application_id' => $application->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Record history + notify after site-visit fee is confirmed.
     */
    public function handleSiteVisitPaid(Application $application): void
    {
        $application->loadMissing('property', 'user');
        $property = $application->property;
        $tenant = $application->user;

        if (! $property || ! $tenant) {
            return;
        }

        $amount = (float) ($application->service_fee ?: SiteVisitPaymentService::SERVICE_FEE);
        $reference = (string) ($application->transaction_id ?: ('SV-APP-' . $application->id));

        $this->recordCompletedPayment(
            $tenant,
            $property,
            $amount,
            'site_visit',
            $reference,
            'Site visit fee — ' . ($property->title ?? 'Property'),
            [
                'application_id' => $application->id,
                'payment_method' => $application->payment_method,
                'source' => 'site_visit_payment_service',
            ],
        );

        $this->notifyStakeholders(
            $property,
            $tenant,
            $amount,
            'site_visit_paid',
            $reference,
            [
                'notify_tenant' => true,
                'tenant_title' => 'Site Visit Fee Confirmed',
                'tenant_message' => 'Your TZS ' . number_format($amount) .
                    ' site visit payment for ' . ($property->title ?? 'your selected property') .
                    ' was received. The agent will contact you to schedule a visit.',
                'tenant_type' => 'site_visit_paid',
            ],
        );
    }

    /**
     * Notify stakeholders after a monthly / scheduled Payment row is completed.
     */
    public function handleMonthlyPaymentCompleted(Payment $payment): void
    {
        $payment->loadMissing('property', 'user');
        $property = $payment->property;
        $tenant = $payment->user;

        if (! $property || ! $tenant) {
            return;
        }

        $this->notifyStakeholders(
            $property,
            $tenant,
            (float) $payment->amount,
            $payment->type === 'monthly_rent' ? 'monthly_rent_paid' : 'rent_paid',
            $payment->reference,
            [
                'notify_tenant' => true,
                'tenant_title' => 'Payment Confirmed',
                'tenant_message' => 'Your rent payment of TZS ' . number_format((float) $payment->amount) .
                    ' was received successfully. Your next month will appear under Rent Payments when due.',
                'tenant_type' => 'payment_confirmed',
            ],
        );

        try {
            app(MonthlyRentService::class)->scheduleNextAfterPayment($payment);
        } catch (\Throwable $e) {
            Log::warning('Failed to schedule next monthly rent after payment', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendEmail(User $recipient, array $payload): void
    {
        if (! $recipient->email) {
            return;
        }

        try {
            Mail::to($recipient->email)->send(new PaymentReceivedMail($payload));
        } catch (\Throwable $e) {
            Log::error('Failed to send payment received email', [
                'user_id' => $recipient->id,
                'email' => $recipient->email,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'rent_paid', 'first_month_rent' => 'Rent payment',
            'monthly_rent_paid', 'monthly_rent' => 'Monthly rent',
            'site_visit_paid', 'site_visit' => 'Site visit fee',
            default => 'Rental payment',
        };
    }
}
