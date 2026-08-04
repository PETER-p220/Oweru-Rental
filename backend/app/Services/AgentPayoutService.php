<?php

namespace App\Services;

use App\Models\Commission;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AgentPayoutService
{
    /**
     * True when Selcom already sent the agent share for the linked payment.
     */
    public function isAutoDisbursed(Commission $commission): bool
    {
        if ($commission->disbursement_method === 'selcom_auto') {
            return true;
        }

        $payment = $commission->payment;
        if (! $payment) {
            return false;
        }

        $metadata = is_array($payment->metadata) ? $payment->metadata : [];

        return (bool) ($metadata['payment_split'] ?? false);
    }

    /**
     * Sync commission rows that were auto-paid via Selcom but still show pending.
     */
    public function syncAutoDisbursedCommissions(): int
    {
        if (! \Schema::hasTable('commissions')) {
            return 0;
        }

        $updated = 0;

        Commission::with('payment')
            ->whereIn('status', ['pending', 'approved'])
            ->whereNotNull('payment_id')
            ->chunkById(100, function ($commissions) use (&$updated) {
                foreach ($commissions as $commission) {
                    if (! $this->isAutoDisbursed($commission)) {
                        continue;
                    }

                    $metadata = is_array($commission->payment?->metadata)
                        ? $commission->payment->metadata
                        : [];

                    $commission->update([
                        'status' => 'paid',
                        'paid_at' => $commission->paid_at ?? now(),
                        'disbursement_method' => 'selcom_auto',
                        'disbursement_reference' => $commission->disbursement_reference
                            ?? ($metadata['split_order_id'] ?? null),
                    ]);
                    $updated++;
                }
            });

        return $updated;
    }

    public function assertCanMarkPaid(Commission $commission): ?string
    {
        if ($commission->status === 'paid') {
            return 'This commission is already marked as paid.';
        }

        if ($this->isAutoDisbursed($commission)) {
            return null;
        }

        if ($commission->payment_id) {
            $duplicate = Commission::where('payment_id', $commission->payment_id)
                ->where('id', '!=', $commission->id)
                ->where('status', 'paid')
                ->exists();

            if ($duplicate) {
                return 'Another commission record for this payment is already paid.';
            }
        }

        return null;
    }

    public function markPaid(
        Commission $commission,
        string $method = 'manual',
        ?string $reference = null,
        ?string $batchId = null,
    ): Commission {
        if ($this->isAutoDisbursed($commission)) {
            $metadata = is_array($commission->payment?->metadata)
                ? $commission->payment->metadata
                : [];

            $commission->update([
                'status' => 'paid',
                'paid_at' => $commission->paid_at ?? now(),
                'disbursement_method' => 'selcom_auto',
                'disbursement_reference' => $reference
                    ?? $commission->disbursement_reference
                    ?? ($metadata['split_order_id'] ?? null),
            ]);

            return $commission->fresh(['agent', 'property', 'payment']);
        }

        $error = $this->assertCanMarkPaid($commission);
        if ($error) {
            throw new \InvalidArgumentException($error);
        }

        $commission->update([
            'status' => 'paid',
            'paid_at' => now(),
            'disbursement_method' => $method,
            'disbursement_reference' => $reference,
            'disbursement_batch_id' => $batchId,
        ]);

        return $commission->fresh(['agent', 'property', 'payment']);
    }

    /**
     * Smart batch payout — skips already-paid and auto-disbursed rows; one batch id per run.
     *
     * @param  array<int>  $commissionIds
     * @return array<string, mixed>
     */
    public function processBatchPayout(array $commissionIds, ?string $batchReference = null): array
    {
        $batchId = $batchReference ?? ('BATCH-' . now()->format('YmdHis'));
        $paid = [];
        $synced = [];
        $skipped = [];
        $errors = [];

        $seenPaymentIds = [];

        DB::transaction(function () use ($commissionIds, $batchId, &$paid, &$synced, &$skipped, &$errors, &$seenPaymentIds) {
            foreach ($commissionIds as $rawId) {
                $id = (int) $rawId;
                $commission = Commission::with('payment')->lockForUpdate()->find($id);

                if (! $commission) {
                    $skipped[] = ['id' => $id, 'reason' => 'not_found'];
                    continue;
                }

                if ($commission->status === 'paid') {
                    $skipped[] = ['id' => $id, 'reason' => 'already_paid'];
                    continue;
                }

                if ($commission->payment_id && in_array($commission->payment_id, $seenPaymentIds, true)) {
                    $skipped[] = ['id' => $id, 'reason' => 'duplicate_payment_in_batch'];
                    continue;
                }

                try {
                    if ($this->isAutoDisbursed($commission)) {
                        $this->markPaid($commission, 'selcom_auto');
                        $synced[] = $id;
                    } else {
                        $this->markPaid($commission, 'manual', null, $batchId);
                        $paid[] = $id;
                    }

                    if ($commission->payment_id) {
                        $seenPaymentIds[] = $commission->payment_id;
                    }
                } catch (\Throwable $e) {
                    $errors[] = ['id' => $id, 'message' => $e->getMessage()];
                }
            }
        });

        return [
            'batch_id' => $batchId,
            'paid' => $paid,
            'synced_auto' => $synced,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Per-agent payout summary for admin (avoids repeat manual sends).
     *
     * @return array<int, array<string, mixed>>
     */
    public function getAgentPayoutSummary(): array
    {
        $this->syncAutoDisbursedCommissions();

        $rows = Commission::with('agent')
            ->get()
            ->groupBy('agent_id');

        return $rows->map(function (Collection $commissions, $agentId) {
            $agent = $commissions->first()?->agent;
            $pending = $commissions->whereIn('status', ['pending', 'approved']);
            $payable = $pending->filter(fn (Commission $c) => ! $this->isAutoDisbursed($c));
            $awaitingSync = $pending->filter(fn (Commission $c) => $this->isAutoDisbursed($c));

            return [
                'agent_id' => (int) $agentId,
                'agent_name' => $agent?->fullName() ?? 'Unknown',
                'agent_code' => 'AGT-' . str_pad((string) $agentId, 3, '0', STR_PAD_LEFT),
                'total_earned' => round((float) $commissions->sum('amount'), 2),
                'paid_amount' => round((float) $commissions->where('status', 'paid')->sum('amount'), 2),
                'pending_amount' => round((float) $payable->sum('amount'), 2),
                'pending_count' => $payable->count(),
                'auto_disbursed_pending_sync' => $awaitingSync->count(),
                'payable_commission_ids' => $payable->pluck('id')->values()->all(),
            ];
        })
            ->sortByDesc('pending_amount')
            ->values()
            ->all();
    }
}
