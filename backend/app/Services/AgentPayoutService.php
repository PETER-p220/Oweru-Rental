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
            'disbursement_method' => $method === 'manual' ? 'oweru_disbursement' : $method,
            'disbursement_reference' => $reference,
            'disbursement_batch_id' => $batchId,
        ]);

        return $commission->fresh(['agent', 'property', 'payment']);
    }

    public function processBatchPayout(array $commissionIds, ?string $batchReference = null, ?string $disbursementReference = null): array
    {
        return $this->processBatchPayoutWithReference(
            $commissionIds,
            $batchReference ?? ('OWERU-BATCH-' . now()->format('YmdHis')),
            $disbursementReference,
        );
    }

    /**
     * @param  array<int>  $commissionIds
     * @return array<string, mixed>
     */
    public function processBatchPayoutWithReference(array $commissionIds, string $batchId, ?string $disbursementReference = null): array
    {
        $paid = [];
        $synced = [];
        $skipped = [];
        $errors = [];

        $seenPaymentIds = [];

        DB::transaction(function () use ($commissionIds, $batchId, $disbursementReference, &$paid, &$synced, &$skipped, &$errors, &$seenPaymentIds) {
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
                        $this->markPaid($commission, 'selcom_auto', $disbursementReference);
                        $synced[] = $id;
                    } else {
                        $this->markPaid($commission, 'oweru_disbursement', $disbursementReference, $batchId);
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
     * Undo a mistaken manual confirmation (soft reverse — no Selcom API call).
     */
    public function revertManualPayment(Commission $commission): Commission
    {
        if ($commission->status !== 'paid') {
            throw new \InvalidArgumentException('Only paid commissions can be reverted.');
        }

        if ($commission->disbursement_method === 'selcom_auto' || $this->isAutoDisbursed($commission)) {
            throw new \InvalidArgumentException('Selcom auto-disbursements cannot be reverted from the admin panel.');
        }

        if (! in_array($commission->disbursement_method, ['manual', 'oweru_disbursement', null], true)) {
            throw new \InvalidArgumentException('This disbursement type cannot be reverted.');
        }

        $commission->update([
            'status' => 'pending',
            'paid_at' => null,
            'disbursement_method' => null,
            'disbursement_reference' => null,
            'disbursement_batch_id' => null,
        ]);

        return $commission->fresh(['agent', 'property', 'payment']);
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
            ->orderByDesc('paid_at')
            ->get()
            ->groupBy('agent_id');

        return $rows->map(function (Collection $commissions, $agentId) {
            $agent = $commissions->first()?->agent;
            $pending = $commissions->whereIn('status', ['pending', 'approved']);
            $payable = $pending->filter(fn (Commission $c) => ! $this->isAutoDisbursed($c));
            $awaitingSync = $pending->filter(fn (Commission $c) => $this->isAutoDisbursed($c));
            $paid = $commissions->where('status', 'paid');
            $lastPaid = $paid->sortByDesc(fn (Commission $c) => $c->paid_at?->timestamp ?? 0)->first();

            $paymentStatus = 'paid';
            if ($payable->count() > 0) {
                $paymentStatus = 'unpaid';
            } elseif ($awaitingSync->count() > 0) {
                $paymentStatus = 'sync_needed';
            } elseif ($paid->count() === 0) {
                $paymentStatus = 'unpaid';
            }

            return [
                'agent_id' => (int) $agentId,
                'agent_name' => $agent?->fullName() ?? 'Unknown',
                'agent_code' => 'AGT-' . str_pad((string) $agentId, 3, '0', STR_PAD_LEFT),
                'agent_email' => $agent?->email,
                'total_earned' => round((float) $commissions->sum('amount'), 2),
                'paid_amount' => round((float) $paid->sum('amount'), 2),
                'paid_count' => $paid->count(),
                'pending_amount' => round((float) $payable->sum('amount'), 2),
                'pending_count' => $payable->count(),
                'auto_disbursed_pending_sync' => $awaitingSync->count(),
                'payable_commission_ids' => $payable->pluck('id')->values()->all(),
                'sync_commission_ids' => $awaitingSync->pluck('id')->values()->all(),
                'last_paid_at' => optional($lastPaid?->paid_at)?->format('Y-m-d H:i'),
                'last_disbursement_method' => $lastPaid?->disbursement_method,
                'last_disbursement_reference' => $lastPaid?->disbursement_reference,
                'payment_status' => $paymentStatus,
                'is_fully_paid' => $paymentStatus === 'paid',
            ];
        })
            ->sortByDesc(fn (array $row) => $row['pending_amount'])
            ->values()
            ->all();
    }

    /**
     * Record Oweru → agent disbursement for every pending commission (one batch).
     *
     * @return array<string, mixed>
     */
    public function confirmAllPendingDisbursements(?string $batchReference = null, ?string $disbursementReference = null): array
    {
        $agentRows = $this->getAgentPayoutSummary();
        $ids = [];

        foreach ($agentRows as $row) {
            $ids = array_merge(
                $ids,
                $row['payable_commission_ids'] ?? [],
                $row['sync_commission_ids'] ?? [],
            );
        }

        $ids = array_values(array_unique(array_map('intval', $ids)));

        if ($ids === []) {
            return [
                'batch_id' => null,
                'paid' => [],
                'synced_auto' => [],
                'skipped' => [],
                'errors' => [],
                'message' => 'No agent commissions awaiting Oweru disbursement.',
            ];
        }

        $batchId = $batchReference ?? ('OWERU-ALL-' . now()->format('YmdHis'));
        $paid = [];
        $synced = [];
        $skipped = [];
        $errors = [];
        $seenPaymentIds = [];

        DB::transaction(function () use ($ids, $batchId, $disbursementReference, &$paid, &$synced, &$skipped, &$errors, &$seenPaymentIds) {
            foreach ($ids as $id) {
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
                        $this->markPaid($commission, 'selcom_auto', $disbursementReference);
                        $synced[] = $id;
                    } else {
                        $this->markPaid($commission, 'oweru_disbursement', $disbursementReference, $batchId);
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
            'message' => sprintf(
                'Recorded Oweru disbursement: %d agent commission(s) paid, %d Selcom-synced, %d skipped.',
                count($paid),
                count($synced),
                count($skipped),
            ),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildDisbursementTotals(array $agentRows): array
    {
        $pendingAmount = 0.0;
        $pendingCount = 0;
        $agentsAwaiting = 0;
        $paidAmount = 0.0;

        foreach ($agentRows as $row) {
            $pendingAmount += (float) ($row['pending_amount'] ?? 0);
            $pendingCount += (int) ($row['pending_count'] ?? 0);
            $paidAmount += (float) ($row['paid_amount'] ?? 0);
            if (! ($row['is_fully_paid'] ?? false)) {
                $agentsAwaiting++;
            }
        }

        return [
            'pending_amount' => round($pendingAmount, 2),
            'pending_count' => $pendingCount,
            'agents_awaiting' => $agentsAwaiting,
            'paid_amount' => round($paidAmount, 2),
            'agent_count' => count($agentRows),
        ];
    }
}
