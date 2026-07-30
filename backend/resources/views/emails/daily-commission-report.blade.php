<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6;">
    <h2 style="color: #0f172a;">Oweru Daily Commission Report</h2>
    <p>Report for <strong>{{ $report['report_label'] }}</strong></p>
    <ul>
        <li>Transactions: {{ $report['grand_totals']['transactions'] }}</li>
        <li>Gross: TZS {{ number_format($report['grand_totals']['gross'], 0) }}</li>
        <li>Oweru share: TZS {{ number_format($report['grand_totals']['oweru'], 0) }}</li>
        <li>Dalali share: TZS {{ number_format($report['grand_totals']['agent'], 0) }}</li>
    </ul>
    <p>The full PDF report is attached.</p>
    <p style="font-size: 12px; color: #94a3b8;">Generated {{ $report['generated_at'] }} · Oweru Rental</p>
</body>
</html>
