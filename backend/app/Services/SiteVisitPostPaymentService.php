<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class SiteVisitPostPaymentService
{
    public function __construct(
        private PaymentAlertService $alerts,
        private PaymentSplitService $splitter,
    ) {}

    /**
     * Idempotent: payment row, split, lead, commission, notifications.
     *
     * @param  array<string, mixed>  $meta
     */
    public function finalize(Application $application, array $meta = []): void
    {
        $application->loadMissing('property', 'user');
        $property = $application->property;
        $tenant = $application->user;

        if (! $property || ! $tenant) {
            Log::warning('Site visit finalize skipped: missing property or tenant', [
                'application_id' => $application->id,
            ]);

            return;
        }

        if ($application->payment_status !== 'paid') {
            return;
        }

        $amount = (float) ($application->service_fee ?: SiteVisitPaymentService::serviceFee());
        $reference = (string) ($application->transaction_id ?: ('SV-APP-' . $application->id));

        $hadPayment = Schema::hasTable('payments')
            && Payment::where('reference', $reference)->exists();

        $payment = $this->alerts->recordCompletedPayment(
            $tenant,
            $property,
            $amount,
            'site_visit',
            $reference,
            'Site visit fee — ' . ($property->title ?? 'Property'),
            array_merge([
                'application_id' => $application->id,
                'payment_method' => $application->payment_method,
                'source' => 'site_visit_payment_service',
                'provider' => strtoupper((string) ($application->payment_method ?? 'TIGO')),
            ], $meta),
        );

        if ($payment && $property->agent_id) {
            try {
                $this->splitter->processSiteVisitSplit($payment->fresh());
            } catch (\Throwable $e) {
                Log::warning('Site visit payment split failed', [
                    'payment_id' => $payment->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $payment = $payment->fresh();
            $this->ensureCommission($payment, $property);
        }

        $this->ensureLead($application, $property, $tenant);

        if (! $hadPayment && $payment) {
            $this->alerts->handleSiteVisitPaidNotifications($application, $payment, $amount, $reference);
        }
    }

    /**
     * Backfill leads / payments / commissions for paid site visits (existing data).
     */
    public function reconcilePaidApplicationsForAgent(int $agentId): void
    {
        if (! Schema::hasTable('applications')) {
            return;
        }

        Application::with(['property', 'user'])
            ->where('payment_status', 'paid')
            ->whereHas('property', fn ($q) => $q->where('agent_id', $agentId))
            ->orderBy('id')
            ->each(fn (Application $app) => $this->finalize($app));
    }

    public function ensureLead(Application $application, $property, $tenant): void
    {
        if (! Schema::hasTable('leads') || ! $property->agent_id) {
            return;
        }

        $name = trim(($tenant->first_name ?? '') . ' ' . ($tenant->last_name ?? ''));
        if ($name === '') {
            $name = $tenant->email ?? 'Visitor';
        }

        $message = $application->message
            ?: ('Paid site visit fee for ' . ($property->title ?? 'property'));

        $lead = Lead::firstOrCreate(
            [
                'agent_id' => $property->agent_id,
                'property_id' => $property->id,
                'user_id' => $tenant->id,
            ],
            [
                'name' => $name,
                'email' => $tenant->email ?? '',
                'phone' => $tenant->phone,
                'message' => $message,
                'source' => 'site_visit',
                'status' => 'interested',
            ],
        );

        if ($lead->wasRecentlyCreated === false && $lead->status === 'new') {
            $lead->update([
                'status' => 'interested',
                'message' => $message,
                'source' => 'site_visit',
            ]);
        }
    }

    public function ensureCommission(Payment $payment, $property): void
    {
        if (! Schema::hasTable('commissions') || ! $property->agent_id) {
            return;
        }

        $share = app(CommissionShareService::class);
        $pct = $share->agentCommissionPercentage($payment);
        if ($pct === null) {
            return;
        }

        $amount = round((float) $payment->amount * ($pct / 100), 2);
        $splitDone = (bool) (($payment->metadata ?? [])['payment_split'] ?? false);

        Commission::updateOrCreate(
            ['payment_id' => $payment->id],
            [
                'agent_id' => $property->agent_id,
                'property_id' => $property->id,
                'amount' => $amount,
                'percentage' => $pct,
                'status' => $splitDone ? 'paid' : 'pending',
                'paid_at' => $splitDone ? now() : null,
            ],
        );
    }
}
