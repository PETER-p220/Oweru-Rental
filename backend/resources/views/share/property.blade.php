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

    {{-- Twitter / X card --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $title }}">
    <meta name="twitter:description" content="{{ $description }}">
    <meta name="twitter:image" content="{{ $imageUrl }}">

    <meta http-equiv="refresh" content="0;url={{ $propertyUrl }}">
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
    </style>
</head>
<body>
    <div>
        <p>Opening property listing…</p>
        <p><a href="{{ $propertyUrl }}">View {{ $title }} on Oweru</a></p>
    </div>
</body>
</html>
