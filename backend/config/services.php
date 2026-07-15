<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'oweru' => [
        'app_key' => env('OWERU_APP_KEY') ?: env('SELCOM_APP_KEY'),
        'checkout_url' => env('OWERU_CHECKOUT_URL', 'https://api.selcom.oweru.com/api/checkout'),
        'admin_phone' => env('OWERU_ADMIN_PHONE'),
    ],

    'rent_fees' => [
        'agent_recipient_share' => (float) env('RENT_AGENT_SHARE', 0.70),
        'agent_oweru_share' => (float) env('RENT_OWERU_SHARE', 0.30),
        'landlord_oweru_fee_months' => (float) env('RENT_LANDLORD_OWERU_FEE_MONTHS', 1),
    ],

    'selcom' => [
        'vendor_id' => env('SELCOM_VENDOR_ID'),
        'api_key' => env('SELCOM_API_KEY'),
        'api_secret' => env('SELCOM_API_SECRET'),
        'base_url' => env('SELCOM_BASE_URL', 'https://apigw.selcommobile.com/v1'),
        'is_live' => env('SELCOM_IS_LIVE', false),
        'environment' => env('SELCOM_ENVIRONMENT', 'sandbox'),
    ],

    'payment' => [
        'commission_percentage' => env('PAYMENT_COMMISSION_PERCENTAGE', 10),
        'service_charge_default' => env('PAYMENT_SERVICE_CHARGE', 0),
        'payment_timeout_minutes' => env('PAYMENT_TIMEOUT_MINUTES', 2),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', 'https://rental.oweru.com/api/auth/google/callback'),
    ],

];
