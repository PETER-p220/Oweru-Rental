<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Oweru Commission Report — {{ $report['report_date'] }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; margin: 24px; }
        h1 { font-size: 20px; margin: 0 0 4px; color: #0f172a; }
        h2 { font-size: 14px; margin: 22px 0 8px; color: #8b5e34; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta { color: #64748b; font-size: 10px; margin-bottom: 18px; }
        .summary { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .summary td { padding: 8px 10px; border: 1px solid #e2e8f0; }
        .summary .label { background: #f8fafc; font-weight: bold; width: 28%; }
        table.data { width: 100%; border-collapse: collapse; margin-top: 8px; }
        table.data th { background: #1e293b; color: #fff; text-align: left; padding: 6px 8px; font-size: 9px; }
        table.data td { border-bottom: 1px solid #e2e8f0; padding: 5px 8px; vertical-align: top; }
        .right { text-align: right; }
        .muted { color: #64748b; }
        .totals { font-weight: bold; background: #fef3c7; }
        .footer { margin-top: 24px; font-size: 9px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <h1>Oweru Rental — Daily Commission Report</h1>
    <div class="meta">
        Report date: <strong>{{ $report['report_label'] }}</strong><br>
        Generated: {{ $report['generated_at'] }}
    </div>

    <table class="summary">
        <tr><td class="label">Total transactions</td><td>{{ $report['grand_totals']['transactions'] }}</td></tr>
        <tr><td class="label">Gross collected (TZS)</td><td>{{ number_format($report['grand_totals']['gross'], 0) }}</td></tr>
        <tr><td class="label">Oweru share (TZS)</td><td>{{ number_format($report['grand_totals']['oweru'], 0) }}</td></tr>
        <tr><td class="label">Dalali / agent share (TZS)</td><td>{{ number_format($report['grand_totals']['agent'], 0) }}</td></tr>
    </table>

    <h2>Site visit payments</h2>
    @if(count($report['site_visits']['rows']) === 0)
        <p class="muted">No site visit payments recorded for this date.</p>
    @else
        <table class="data">
            <thead>
                <tr>
                    <th>Reference</th><th>Property</th><th>Dalali</th><th>Tenant</th>
                    <th class="right">Gross</th><th class="right">Oweru</th><th class="right">Agent</th><th>Paid</th>
                </tr>
            </thead>
            <tbody>
                @foreach($report['site_visits']['rows'] as $row)
                <tr>
                    <td>{{ $row['reference'] }}</td>
                    <td>{{ $row['property'] }}</td>
                    <td>{{ $row['agent'] }}<br><span class="muted">{{ $row['agent_code'] }}</span></td>
                    <td>{{ $row['tenant'] }}</td>
                    <td class="right">{{ number_format($row['gross'], 0) }}</td>
                    <td class="right">{{ number_format($row['oweru'], 0) }}</td>
                    <td class="right">{{ number_format($row['agent_amount'], 0) }}</td>
                    <td>{{ $row['paid_at'] }}</td>
                </tr>
                @endforeach
                <tr class="totals">
                    <td colspan="4">Site visit totals ({{ $report['site_visits']['totals']['count'] }})</td>
                    <td class="right">{{ number_format($report['site_visits']['totals']['gross'], 0) }}</td>
                    <td class="right">{{ number_format($report['site_visits']['totals']['oweru'], 0) }}</td>
                    <td class="right">{{ number_format($report['site_visits']['totals']['agent'], 0) }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    @endif

    <h2>Rental payments</h2>
    @if(count($report['rentals']['rows']) === 0)
        <p class="muted">No rental payments recorded for this date.</p>
    @else
        <table class="data">
            <thead>
                <tr>
                    <th>Reference</th><th>Property</th><th>Dalali</th><th>Tenant</th>
                    <th class="right">Gross</th><th class="right">Oweru</th><th class="right">Agent</th><th>Paid</th>
                </tr>
            </thead>
            <tbody>
                @foreach($report['rentals']['rows'] as $row)
                <tr>
                    <td>{{ $row['reference'] }}</td>
                    <td>{{ $row['property'] }}</td>
                    <td>{{ $row['agent'] }}</td>
                    <td>{{ $row['tenant'] }}</td>
                    <td class="right">{{ number_format($row['gross'], 0) }}</td>
                    <td class="right">{{ number_format($row['oweru'], 0) }}</td>
                    <td class="right">{{ number_format($row['agent_amount'], 0) }}</td>
                    <td>{{ $row['paid_at'] }}</td>
                </tr>
                @endforeach
                <tr class="totals">
                    <td colspan="4">Rental totals ({{ $report['rentals']['totals']['count'] }})</td>
                    <td class="right">{{ number_format($report['rentals']['totals']['gross'], 0) }}</td>
                    <td class="right">{{ number_format($report['rentals']['totals']['oweru'], 0) }}</td>
                    <td class="right">{{ number_format($report['rentals']['totals']['agent'], 0) }}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    @endif

    <h2>Dalali (agent) commission summary</h2>
    @if(count($report['agent_breakdown']) === 0)
        <p class="muted">No agent commissions for this date.</p>
    @else
        <table class="data">
            <thead>
                <tr>
                    <th>Agent</th><th>Code</th>
                    <th class="right">Site visits</th><th class="right">Rentals</th><th class="right">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($report['agent_breakdown'] as $agent)
                <tr>
                    <td>{{ $agent['agent'] }}</td>
                    <td>{{ $agent['code'] }}</td>
                    <td class="right">{{ number_format($agent['site_visit_commission'], 0) }}</td>
                    <td class="right">{{ number_format($agent['rental_commission'], 0) }}</td>
                    <td class="right"><strong>{{ number_format($agent['total'], 0) }}</strong></td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">Oweru Rental · Confidential finance report · {{ $report['generated_at'] }}</div>
</body>
</html>
