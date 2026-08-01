<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} · Oweru Rental</title>
    <meta name="description" content="{{ $description }}">

    {{-- Open Graph (WhatsApp, Facebook, iMessage) --}}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Oweru Rental">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:url" content="{{ $shareUrl }}">
    <meta property="og:image" content="{{ $imageUrl }}">
    <meta property="og:image:secure_url" content="{{ $imageUrl }}">
    <meta property="og:image:alt" content="{{ $title }}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    {{-- Twitter / X card --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $title }}">
    <meta name="twitter:description" content="{{ $description }}">
    <meta name="twitter:image" content="{{ $imageUrl }}">

    <link rel="canonical" href="{{ $propertyUrl }}">
    <style>
        body {
            font-family: system-ui, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            text-align: center;
        }
        a { color: #c89128; }
        img.preview {
            max-width: min(100%, 420px);
            border-radius: 12px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div>
        <img class="preview" src="{{ $imageUrl }}" alt="{{ $title }}">
        <h1 style="font-size: 1.25rem; margin: 0 0 8px;">{{ $title }}</h1>
        <p style="opacity: 0.85; max-width: 420px; margin: 0 auto 16px;">{{ $description }}</p>
        <p><a href="{{ $propertyUrl }}">View on Oweru Rental</a></p>
    </div>
    <script>
        (function () {
            var ua = navigator.userAgent || '';
            var isBot = /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|googlebot|bingbot|bot|crawl|spider/i.test(ua);
            if (!isBot) {
                window.location.replace(@json($propertyUrl));
            }
        })();
    </script>
</body>
</html>
