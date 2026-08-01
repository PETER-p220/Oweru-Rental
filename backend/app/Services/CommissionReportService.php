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
