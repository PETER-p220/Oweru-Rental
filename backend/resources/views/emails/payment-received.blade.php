<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Received</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border:1px solid #E2E8F0;max-width:560px;">
                    <tr>
                        <td style="background:#1E293B;padding:24px 28px;">
                            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C89128;margin-bottom:8px;">Oweru Rental</div>
                            <div style="font-size:22px;font-weight:700;color:#FFFFFF;">Payment received</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Hello {{ $payload['recipient_name'] }},
                            </p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                                <strong>{{ $payload['tenant_name'] }}</strong> has successfully paid
                                <strong>TZS {{ $payload['amount'] }}</strong>
                                ({{ $payload['payment_type_label'] }}) for
                                <strong>{{ $payload['property_title'] }}</strong>.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;border:1px solid #E2E8F0;margin-bottom:20px;">
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;">Amount</td>
                                    <td style="padding:14px 16px;font-size:14px;font-weight:700;text-align:right;color:#0F172A;">TZS {{ $payload['amount'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Property</td>
                                    <td style="padding:14px 16px;font-size:14px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">{{ $payload['property_title'] }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Type</td>
                                    <td style="padding:14px 16px;font-size:14px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">{{ $payload['payment_type_label'] }}</td>
                                </tr>
                                @if (!empty($payload['reference']))
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Reference</td>
                                    <td style="padding:14px 16px;font-size:13px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">{{ $payload['reference'] }}</td>
                                </tr>
                                @endif
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;color:#64748B;border-top:1px solid #E2E8F0;">Paid at</td>
                                    <td style="padding:14px 16px;font-size:14px;text-align:right;color:#0F172A;border-top:1px solid #E2E8F0;">{{ $payload['paid_at'] }}</td>
                                </tr>
                            </table>
                            <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">
                                You can also review this in your Oweru dashboard notifications.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;">
                            This is an automated message from Oweru Rental.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
