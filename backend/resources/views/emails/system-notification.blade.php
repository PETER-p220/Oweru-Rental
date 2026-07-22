<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $payload['title'] }}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#FFFFFF;border:1px solid #E2E8F0;max-width:560px;">
                    <tr>
                        <td style="background:#1E293B;padding:24px 28px;">
                            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C89128;margin-bottom:8px;">Oweru Rental</div>
                            <div style="font-size:20px;font-weight:700;color:#FFFFFF;">{{ $payload['title'] }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                                Hello {{ $payload['recipient_name'] }},
                            </p>
                            <p style="margin:0 0 20px;font-size:15px;line-height:1.65;white-space:pre-line;">{{ $payload['message'] }}</p>
                            @if (!empty($payload['action_url']))
                            <p style="margin:0 0 8px;">
                                <a href="{{ $payload['action_url'] }}" style="display:inline-block;background:#C89128;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:14px;">Open Oweru Rental</a>
                            </p>
                            @endif
                            <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
                                You also have this update in your dashboard notifications.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#94A3B8;">
                            Automated message from Oweru Rental. Reply is not monitored on this address.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
