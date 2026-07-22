<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rent period reminder</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border:1px solid #E2E8F0;max-width:560px;">
                    <tr>
                        <td style="background:#1E293B;padding:24px 28px;">
                            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C89128;margin-bottom:8px;">Oweru Rental</div>
                            <div style="font-size:22px;font-weight:700;color:#FFFFFF;">Upcoming rent period</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Hello {{ $payload['tenant_name'] }},
                            </p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                                Your rental period for <strong>{{ $payload['property_title'] }}</strong>
                                ({{ $payload['period_label'] }}) is ending soon.
                                Please pay the next month&apos;s rent within <strong>{{ $payload['days_remaining'] }} days</strong>
                                to stay current.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;border:1px solid #E2E8F0;margin-bottom:20px;">
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;">Amount due</td>
                                    <td style="padding:14px 16px;font-size:14px;font-weight:700;text-align:right;color:#0F172A;">TZS {{ $payload['amount'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Due date</td>
                                    <td style="padding:14px 16px;font-size:14px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">{{ $payload['due_date'] }}</td>
                                </tr>
                            </table>
                            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">
                                Sign in to Oweru Rental → Rent Payments to complete payment. You also received an in-app notification.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;">
                            This is an automated reminder from Oweru Rental.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
