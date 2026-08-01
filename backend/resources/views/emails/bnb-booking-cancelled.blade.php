<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking cancelled</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border:1px solid #E2E8F0;max-width:560px;">
                    <tr>
                        <td style="background:#1E293B;padding:24px 28px;">
                            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C89128;margin-bottom:8px;">Oweru Rental</div>
                            <div style="font-size:22px;font-weight:700;color:#FFFFFF;">Short-stay booking cancelled</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Hello {{ $payload['guest_name'] }},
                            </p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                                Your booking for <strong>{{ $payload['property_title'] }}</strong>
                                ({{ $payload['check_in'] }} → {{ $payload['check_out'] }}) has been <strong>cancelled</strong>.
                            </p>
                            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
                                {{ $payload['reason'] }}
                            </p>
                            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#64748B;">
                                The dates have been released so other guests can book. You may start a new reservation at any time.
                            </p>
                            @if(!empty($payload['browse_url']))
                            <table role="presentation" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="border-radius:8px;background:#C89128;">
                                        <a href="{{ $payload['browse_url'] }}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#0F172A;text-decoration:none;">
                                            Browse short stays
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;">
                            Questions? Reply to this email or contact Oweru Rental support.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
