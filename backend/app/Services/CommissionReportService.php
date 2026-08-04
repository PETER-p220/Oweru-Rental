<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonInterface;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\View;

class CommissionReportService
{
    public function __construct(private CommissionShareService $shareService) {}

    /**
     * Build report payload for a calendar day (paid/completed activity).
     *
     * @return array<string, mixed>
     */
    public function buildDailyReport(CarbonInterface $date): array
    {
        $start = $date->copy()->startOfDay();
        $end = $date->copy()->endOfDay();

        $payments = Payment::with(['user', 'property', 'agent'])
            ->whereIn('status', ['completed', 'paid'])
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('paid_at', [$start, $end])
                    ->orWhere(function ($q2) use ($start, $end) {
                        $q2->whereNull('paid_at')->whereBetween('created_at', [$start, $end]);
                    });
            })
            ->whereIn('type', array_merge(['site_visit'], CommissionShareService::RENT_TYPES))
            ->orderBy('created_at')
            ->get();

        $siteVisitRows = [];
        $rentalRows = [];
        $siteVisitTotals = ['gross' => 0.0, 'oweru' => 0.0, 'agent' => 0.0, 'count' => 0];
        $rentalTotals = ['gross' => 0.0, 'oweru' => 0.0, 'agent' => 0.0, 'count' => 0];

        foreach ($payments as $payment) {
            $split = $this->shareService->splitAmounts($payment);
            $agent = $payment->agent;
            $row = [
                'reference' => $payment->reference ?: ('PAY-' . $payment->id),
                'property' => $payment->property?->title ?? '—',
                'tenant' => $payment->user?->fullName() ?? '—',
                'agent' => $agent?->fullName() ?? '—',
                'agent_code' => $agent ? ('AGT-' . str_pad((string) $agent->id, 3, '0', STR_PAD_LEFT)) : '—',
                'gross' => $split['gross'],
                'oweru' => $split['oweru'],
                'agent_amount' => $split['agent'],
                'paid_at' => optional($payment->paid_at ?? $payment->created_at)?->format('Y-m-d H:i'),
                'type' => $payment->type,
            ];

            if ($payment->type === 'site_visit') {
                $siteVisitRows[] = $row;
                $siteVisitTotals['gross'] += $split['gross'];
                $siteVisitTotals['oweru'] += $split['oweru'];
                $siteVisitTotals['agent'] += $split['agent'];
                $siteVisitTotals['count']++;
            } else {
                $rentalRows[] = $row;
                $rentalTotals['gross'] += $split['gross'];
                $rentalTotals['oweru'] += $split['oweru'];
                $rentalTotals['agent'] += $split['agent'];
                $rentalTotals['count']++;
            }
        }

        $commissions = Commission::with(['agent', 'property', 'payment'])
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get()
            ->map(fn (Commission $c) => [
                'reference' => 'COM-' . str_pad((string) $c->id, 5, '0', STR_PAD_LEFT),
                'agent' => $c->agent?->fullName() ?? '—',
                'property' => $c->property?->title ?? '—',
                'amount' => (float) $c->amount,
                'percentage' => (float) ($c->percentage ?? 0),
                'status' => $c->status,
                'category' => $c->payment?->type === 'site_visit' ? 'Site visit' : 'Rental',
                'created_at' => optional($c->created_at)?->format('Y-m-d H:i'),
            ]);

        $agentBreakdown = $this->agentBreakdown($payments);

        return [
            'report_date' => $date->toDateString(),
            'report_label' => $date->format('l, F j, Y'),
            'generated_at' => now()->format('Y-m-d H:i T'),
            'site_visits' => [
                'rows' => $siteVisitRows,
                'totals' => $siteVisitTotals,
            ],
            'rentals' => [
                'rows' => $rentalRows,
                'totals' => $rentalTotals,
            ],
            'commissions' => $commissions->values()->all(),
            'agent_breakdown' => $agentBreakdown,
            'grand_totals' => [
                'gross' => round($siteVisitTotals['gross'] + $rentalTotals['gross'], 2),
                'oweru' => round($siteVisitTotals['oweru'] + $rentalTotals['oweru'], 2),
                'agent' => round($siteVisitTotals['agent'] + $rentalTotals['agent'], 2),
                'transactions' => $siteVisitTotals['count'] + $rentalTotals['count'],
            ],
        ];
    }

    /**
     * @param  Collection<int, Payment>  $payments
     * @return array<int, array<string, mixed>>
     */
    private function agentBreakdown(Collection $payments): array
    {
        $map = [];

        foreach ($payments as $payment) {
            if (! $payment->agent_id) {
                continue;
            }
            $split = $this->shareService->splitAmounts($payment);
            $id = $payment->agent_id;
            if (! isset($map[$id])) {
                $map[$id] = [
                    'agent' => $payment->agent?->fullName() ?? 'Agent',
                    'code' => 'AGT-' . str_pad((string) $id, 3, '0', STR_PAD_LEFT),
                    'site_visit_commission' => 0.0,
                    'rental_commission' => 0.0,
                    'total' => 0.0,
                ];
            }
            if ($payment->type === 'site_visit') {
                $map[$id]['site_visit_commission'] += $split['agent'];
            } else {
                $map[$id]['rental_commission'] += $split['agent'];
            }
            $map[$id]['total'] += $split['agent'];
        }

        return collect($map)
            ->sortByDesc('total')
            ->values()
            ->map(fn ($row) => [
                ...$row,
                'site_visit_commission' => round($row['site_visit_commission'], 2),
                'rental_commission' => round($row['rental_commission'], 2),
                'total' => round($row['total'], 2),
            ])
            ->all();
    }

    /**
     * Oweru platform revenue report for a date range (from completed payments).
     *
     * @return array<string, mixed>
     */
    public function buildOweruPeriodReport(CarbonInterface $from, CarbonInterface $to): array
    {
        $payments = $this->paymentsInRange($from, $to);

        $rows = [];
        $totals = ['gross' => 0.0, 'oweru' => 0.0, 'agent' => 0.0, 'count' => 0];
        $byCategory = [
            'site_visit' => ['oweru' => 0.0, 'count' => 0],
            'rental' => ['oweru' => 0.0, 'count' => 0],
        ];

        foreach ($payments as $payment) {
            $split = $this->shareService->splitAmounts($payment);
            $category = $this->shareService->categoryKey($payment);

            $rows[] = [
                'reference' => $payment->reference ?: ('PAY-' . $payment->id),
                'property' => $payment->property?->title ?? '—',
                'type' => $payment->type,
                'category' => $category,
                'gross' => $split['gross'],
                'oweru_amount' => $split['oweru'],
                'agent_amount' => $split['agent'],
                'paid_at' => optional($payment->paid_at ?? $payment->created_at)?->format('Y-m-d H:i'),
            ];

            $totals['gross'] += $split['gross'];
            $totals['oweru'] += $split['oweru'];
            $totals['agent'] += $split['agent'];
            $totals['count']++;

            if (isset($byCategory[$category])) {
                $byCategory[$category]['oweru'] += $split['oweru'];
                $byCategory[$category]['count']++;
            }
        }

        return [
            'report_type' => 'oweru',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'generated_at' => now()->format('Y-m-d H:i T'),
            'rows' => $rows,
            'totals' => [
                'gross' => round($totals['gross'], 2),
                'oweru' => round($totals['oweru'], 2),
                'agent' => round($totals['agent'], 2),
                'transactions' => $totals['count'],
            ],
            'by_category' => $byCategory,
        ];
    }

    /**
     * Agent (dalali) commission report for a date range.
     *
     * @return array<string, mixed>
     */
    public function buildAgentPeriodReport(CarbonInterface $from, CarbonInterface $to): array
    {
        $payments = $this->paymentsInRange($from, $to);
        $agentBreakdown = $this->agentBreakdown($payments);

        $rows = [];
        $totals = ['gross' => 0.0, 'agent' => 0.0, 'count' => 0];

        foreach ($payments as $payment) {
            if (! $payment->agent_id) {
                continue;
            }

            $split = $this->shareService->splitAmounts($payment);
            if ($split['agent'] <= 0) {
                continue;
            }

            $rows[] = [
                'reference' => $payment->reference ?: ('PAY-' . $payment->id),
                'property' => $payment->property?->title ?? '—',
                'agent' => $payment->agent?->fullName() ?? '—',
                'agent_code' => 'AGT-' . str_pad((string) $payment->agent_id, 3, '0', STR_PAD_LEFT),
                'type' => $payment->type,
                'gross' => $split['gross'],
                'agent_amount' => $split['agent'],
                'oweru_amount' => $split['oweru'],
                'paid_at' => optional($payment->paid_at ?? $payment->created_at)?->format('Y-m-d H:i'),
            ];

            $totals['gross'] += $split['gross'];
            $totals['agent'] += $split['agent'];
            $totals['count']++;
        }

        $commissionLedger = Commission::with(['agent', 'property'])
            ->whereBetween('created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->orderBy('created_at')
            ->get()
            ->map(fn (Commission $c) => [
                'id' => $c->id,
                'reference' => 'COM-' . str_pad((string) $c->id, 5, '0', STR_PAD_LEFT),
                'agent' => $c->agent?->fullName() ?? '—',
                'property' => $c->property?->title ?? '—',
                'amount' => (float) $c->amount,
                'status' => $c->status,
                'disbursement_method' => $c->disbursement_method,
                'paid_at' => optional($c->paid_at)?->format('Y-m-d H:i'),
            ])
            ->values()
            ->all();

        return [
            'report_type' => 'agents',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'generated_at' => now()->format('Y-m-d H:i T'),
            'rows' => $rows,
            'agent_breakdown' => $agentBreakdown,
            'commission_ledger' => $commissionLedger,
            'totals' => [
                'gross' => round($totals['gross'], 2),
                'agent' => round($totals['agent'], 2),
                'transactions' => $totals['count'],
            ],
        ];
    }

    /**
     * @return Collection<int, Payment>
     */
    private function paymentsInRange(CarbonInterface $from, CarbonInterface $to): Collection
    {
        $start = $from->copy()->startOfDay();
        $end = $to->copy()->endOfDay();

        return Payment::with(['user', 'property', 'agent'])
            ->whereIn('status', ['completed', 'paid'])
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('paid_at', [$start, $end])
                    ->orWhere(function ($q2) use ($start, $end) {
                        $q2->whereNull('paid_at')->whereBetween('created_at', [$start, $end]);
                    });
            })
            ->whereIn('type', array_merge(['site_visit'], CommissionShareService::RENT_TYPES))
            ->orderBy('created_at')
            ->get();
    }

    public function renderPdf(array $report): string
    {
        $html = View::make('reports.daily-commission', ['report' => $report])->render();

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    public function reportFilename(CarbonInterface $date): string
    {
        return 'oweru-commission-report-' . $date->format('Y-m-d') . '.pdf';
    }

    public function reportRecipient(): string
    {
        return (string) config(
            'services.oweru.report_email',
            config('mail.from.address', 'admin@oweru.com')
        );
    }
}
