@php
    $days = (int) ($payload['days_remaining'] ?? 10);
    $headline = match ($days) {
        1 => 'Rent due tomorrow',
        3 => 'Rent due in 3 days',
        default => 'Upcoming rent period',
    };
    $intro = match ($days) {
        1 => 'This is a final reminder that your rent payment is due tomorrow. Please pay on time to avoid any interruption to your tenancy.',
        3 => 'Your rent payment is due in 3 days. We recommend completing payment soon to stay current on your lease.',
        default => 'Your rental period is ending soon. Please pay the next month\'s rent on time to continue your tenancy without interruption.',
    };
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $headline }}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border:1px solid #E2E8F0;max-width:560px;">
                    <tr>
                        <td style="background:#1E293B;padding:24px 28px;">
                            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C89128;margin-bottom:8px;">Oweru Rental</div>
                            <div style="font-size:22px;font-weight:700;color:#FFFFFF;">{{ $headline }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Dear {{ $payload['tenant_name'] }},
                            </p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                                {{ $intro }}
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;border:1px solid #E2E8F0;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;">Property</td>
                                    <td style="padding:14px 16px;font-size:14px;font-weight:600;text-align:right;color:#0F172A;">{{ $payload['property_title'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Rental period</td>
                                    <td style="padding:14px 16px;font-size:14px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">{{ $payload['period_label'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Amount due</td>
                                    <td style="padding:14px 16px;font-size:14px;font-weight:700;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">TZS {{ $payload['amount'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Due date</td>
                                    <td style="padding:14px 16px;font-size:14px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">{{ $payload['due_date'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Time remaining</td>
                                    <td style="padding:14px 16px;font-size:14px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">
                                        @if($days === 1)
                                            1 day
                                        @else
                                            {{ $days }} days
                                        @endif
                                    </td>
                                </tr>
                            </table>
                            @if(!empty($payload['payments_url']))
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                                <tr>
                                    <td style="border-radius:8px;background:#C89128;">
                                        <a href="{{ $payload['payments_url'] }}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#0F172A;text-decoration:none;">
                                            Pay rent now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            @endif
                            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">
                                You can also sign in to Oweru Rental and open <strong>Rent Payments</strong> from your tenant dashboard. A copy of this reminder has been saved in your in-app notifications.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;">
                            This is an automated message from Oweru Rental. If you have already paid, please disregard this email.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
