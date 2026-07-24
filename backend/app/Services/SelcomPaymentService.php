<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SelcomPaymentService
{
    private function appKey(): ?string
    {
        $key = config('services.oweru.app_key');

        return is_string($key) && trim($key) !== '' ? trim($key) : null;
    }

    private function checkoutBaseUrl(): string
    {
        return rtrim((string) config('services.oweru.checkout_url', 'https://api.selcom.oweru.com/api/checkout'), '/');
    }

    /**
     * Map client/provider codes to Selcom wallet-payment codes.
     */
    public static function mapProvider(string $provider): string
    {
        $key = strtoupper(trim($provider));

        return match ($key) {
            'TIGO' => 'TIGO',
            'MPESA' => 'MPESA',
            'AIRTEL' => 'AIRTEL',
            'HALOPESA', 'HALOPES', 'HALO-PESA' => 'HALO-PESA',
            default => $key,
        };
    }

    public function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '255' . substr($phone, 1);
        }
        if (! str_starts_with($phone, '255')) {
            return '255' . $phone;
        }

        return $phone;
    }

    /**
     * Initiate mobile money USSD push via Oweru → Selcom checkout API.
     *
     * @param  array{amount:numeric,phone_number:string,provider:string,customer_email:string,customer_name:string,order_id:string,payment_type:string,property_id:int,tenant_id:int}  $data
     * @return array{success:bool,message?:string,data?:array<string,mixed>}
     */
    public function initiate(array $data): array
    {
        $appKey = $this->appKey();
        $baseUrl = $this->checkoutBaseUrl();

        if (! $appKey) {
            Log::error('Missing payment app key — set OWERU_APP_KEY in .env and run php artisan config:cache');

            return [
                'success' => false,
                'message' => 'Payment service not configured.',
            ];
        }

        $phone = $this->normalizePhone((string) $data['phone_number']);
        $amount = number_format((int) $data['amount'], 0, '.', '');
        $orderId = (string) $data['order_id'];
        $provider = strtoupper((string) $data['provider']);
        $selcomProvider = self::mapProvider($provider);

        $createPayload = [
            'order_id' => $orderId,
            'buyer_name' => trim((string) $data['customer_name']),
            'buyer_email' => trim((string) $data['customer_email']),
            'buyer_phone' => $phone,
            'amount' => $amount,
            'currency' => 'TZS',
            'buyer_remarks' => (string) $data['payment_type'],
            'merchant_remarks' => 'Oweru Rental - ' . $data['payment_type'],
            'no_of_items' => 1,
        ];

        $createResult = $this->createOrderMinimal($createPayload);
        if (! ($createResult['success'] ?? false)) {
            return [
                'success' => false,
                'message' => $createResult['message'] ?? 'Could not create payment order.',
            ];
        }

        $payPayload = [
            'order_id' => $orderId,
            'transid' => $orderId,
            'msisdn' => $phone,
            'provider' => $selcomProvider,
        ];

        Log::info('Oweru wallet-payment request', [
            'payload' => $payPayload,
            'provider_debug' => $provider,
        ]);

        $payResponse = Http::withHeaders([
            'X-App-Key' => $appKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->post($baseUrl . '/wallet-payment', $payPayload);

        $payData = $payResponse->json();
        $payResult = strtoupper((string) ($payData['result'] ?? ''));
        $payOk = $payResponse->successful()
            && ! in_array($payResult, ['FAIL', 'FAILED', 'ERROR'], true);

        // Halopesa: retry alternate Selcom provider code if first attempt failed
        if (! $payOk && $selcomProvider === 'HALO-PESA') {
            Log::info('Retrying Halopesa with HALOPESA provider code');
            $payPayload['provider'] = 'HALOPESA';
            $payResponse = Http::withHeaders([
                'X-App-Key' => $appKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post($baseUrl . '/wallet-payment', $payPayload);
            $payData = $payResponse->json();
            $payResult = strtoupper((string) ($payData['result'] ?? ''));
            $payOk = $payResponse->successful()
                && ! in_array($payResult, ['FAIL', 'FAILED', 'ERROR'], true);
            if ($payOk) {
                $selcomProvider = 'HALOPESA';
            }
        }

        if (! $payOk) {
            $errorDetail = $payData['detail']
                ?? $payData['message']
                ?? $payData['error']
                ?? $payResponse->body()
                ?: 'Payment trigger failed';

            Log::error('Oweru wallet-payment failed', [
                'status' => $payResponse->status(),
                'detail' => $errorDetail,
                'provider_used' => $selcomProvider,
                'result' => $payResult,
            ]);

            return [
                'success' => false,
                'message' => 'Payment request could not be sent: ' . $errorDetail,
            ];
        }

        return [
            'success' => true,
            'data' => [
                'transaction_id' => $orderId,
                'order_id' => $orderId,
                'status' => 'pending',
                'provider' => $provider,
                'selcom_provider' => $selcomProvider,
            ],
            'message' => 'Payment request sent. Please check your phone and approve the prompt.',
        ];
    }

    /**
     * Create a Selcom/Oweru checkout order and return a hosted payment URL (card/bank).
     *
     * @param  array{amount:numeric,phone_number?:string,customer_email:string,customer_name:string,order_id:string,payment_type:string,return_url?:string}  $data
     * @return array{success:bool,message?:string,data?:array<string,mixed>}
     */
    public function initiateHostedCheckout(array $data): array
    {
        $appKey = $this->appKey();
        if (! $appKey) {
            return [
                'success' => false,
                'message' => 'Payment service not configured.',
            ];
        }

        $phone = $this->normalizePhone((string) ($data['phone_number'] ?? '255700000000'));
        $amount = number_format((int) $data['amount'], 0, '.', '');
        $orderId = (string) $data['order_id'];
        $baseUrl = $this->checkoutBaseUrl();
        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');
        $returnUrl = (string) ($data['return_url'] ?? "{$frontend}/bnb/payment/return?order_id={$orderId}");

        $createPayload = [
            'order_id' => $orderId,
            'buyer_name' => trim((string) $data['customer_name']),
            'buyer_email' => trim((string) $data['customer_email']),
            'buyer_phone' => $phone,
            'amount' => $amount,
            'currency' => 'TZS',
            'buyer_remarks' => (string) $data['payment_type'],
            'merchant_remarks' => 'Oweru Rental - ' . $data['payment_type'],
            'no_of_items' => 1,
        ];

        $createResult = $this->createOrderMinimal($createPayload);
        if (! ($createResult['success'] ?? false)) {
            return [
                'success' => false,
                'message' => $createResult['message'] ?? 'Could not create payment order.',
            ];
        }

        $checkoutUrl = $this->extractCheckoutUrl($createResult['data'] ?? [], $orderId);

        if (! $checkoutUrl) {
            $attempts = [
                ['post', '/card-payment', [
                    'order_id' => $orderId,
                    'redirect_url' => $returnUrl,
                    'return_url' => $returnUrl,
                ]],
                ['post', '/bank-payment', [
                    'order_id' => $orderId,
                    'redirect_url' => $returnUrl,
                    'return_url' => $returnUrl,
                ]],
                ['post', '/create-payment-url', [
                    'order_id' => $orderId,
                    'redirect_url' => $returnUrl,
                    'payment_method' => 'CARD',
                ]],
            ];

            foreach ($attempts as [$method, $path, $payload]) {
                $response = $method === 'get'
                    ? Http::withHeaders(['X-App-Key' => $appKey, 'Accept' => 'application/json'])
                        ->get($baseUrl . $path)
                    : Http::withHeaders([
                        'X-App-Key' => $appKey,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])->post($baseUrl . $path, $payload);

                if (! $response->successful()) {
                    continue;
                }

                $checkoutUrl = $this->extractCheckoutUrl($response->json() ?? [], $orderId);
                if ($checkoutUrl) {
                    break;
                }
            }
        }

        if (! $checkoutUrl) {
            return [
                'success' => false,
                'message' => 'Bank/card checkout is not available right now. Please use mobile money.',
            ];
        }

        return [
            'success' => true,
            'message' => 'Redirecting to secure bank/card checkout.',
            'data' => [
                'transaction_id' => $orderId,
                'order_id' => $orderId,
                'checkout_url' => $checkoutUrl,
                'payment_mode' => 'bank',
                'status' => 'pending',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{success:bool,message?:string,data?:array<string,mixed>}
     */
    private function createOrderMinimal(array $payload): array
    {
        $appKey = $this->appKey();
        $baseUrl = $this->checkoutBaseUrl();

        if (! $appKey) {
            return [
                'success' => false,
                'message' => 'Payment service not configured.',
            ];
        }

        Log::info('Oweru create-order-minimal request', ['payload' => $payload]);

        $createResponse = Http::withHeaders([
            'X-App-Key' => $appKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->post($baseUrl . '/create-order-minimal', $payload);

        $createData = $createResponse->json() ?? [];

        if (! $createResponse->successful() || ($createData['result'] ?? '') !== 'SUCCESS') {
            $errorDetail = $createData['detail']
                ?? $createData['message']
                ?? $createData['error']
                ?? $createResponse->body()
                ?: 'Unknown error from Oweru';

            Log::error('Oweru create-order-minimal failed', [
                'status' => $createResponse->status(),
                'detail' => $errorDetail,
            ]);

            return [
                'success' => false,
                'message' => 'Could not create payment order: ' . $errorDetail,
            ];
        }

        return [
            'success' => true,
            'data' => $createData,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function extractCheckoutUrl(array $data, string $orderId): ?string
    {
        $candidates = [
            $data['payment_gateway_url'] ?? null,
            $data['checkout_url'] ?? null,
            $data['payment_url'] ?? null,
            $data['redirect_url'] ?? null,
            $data['url'] ?? null,
            $data['gateway_url'] ?? null,
            is_array($data['data'] ?? null) ? ($data['data']['payment_gateway_url'] ?? $data['data']['checkout_url'] ?? $data['data']['payment_url'] ?? $data['data']['url'] ?? null) : null,
        ];

        foreach ($candidates as $url) {
            if (is_string($url) && filter_var($url, FILTER_VALIDATE_URL)) {
                return $url;
            }
        }

        return null;
    }

    /**
     * Poll payment order status (Oweru checkout first — orders are created there).
     *
     * @return array{success:bool,paid:bool,failed:bool,status?:string,data?:array<string,mixed>}
     */
    public function checkOrderStatus(string $orderId): array
    {
        // 1) Oweru checkout — same gateway used to initiate wallet-payment
        $oweru = $this->checkOweruOrderStatus($orderId);
        if ($oweru['paid'] || $oweru['failed']) {
            return $oweru;
        }

        // 2) Selcom direct API — only when configured and Oweru did not resolve
        $selcom = $this->checkSelcomTransactionStatus($orderId);
        if ($selcom['paid'] || $selcom['failed']) {
            return $selcom;
        }

        return $oweru['success'] ? $oweru : ($selcom['success'] ? $selcom : [
            'success' => false,
            'paid' => false,
            'failed' => false,
        ]);
    }

    /**
     * @return array{success:bool,paid:bool,failed:bool,status?:string,data?:array<string,mixed>}
     */
    private function checkOweruOrderStatus(string $orderId): array
    {
        try {
            $appKey = $this->appKey();
            $baseUrl = $this->checkoutBaseUrl();

            if (! $appKey) {
                return ['success' => false, 'paid' => false, 'failed' => false];
            }

            $headers = [
                'X-App-Key' => $appKey,
                'Accept' => 'application/json',
            ];

            $attempts = [
                fn () => Http::withHeaders($headers)->timeout(20)
                    ->get($baseUrl . '/order-status/' . urlencode($orderId)),
                fn () => Http::withHeaders(array_merge($headers, [
                    'Content-Type' => 'application/json',
                ]))->timeout(20)->post($baseUrl . '/order-status', [
                    'order_id' => $orderId,
                    'transid' => $orderId,
                ]),
                fn () => Http::withHeaders(array_merge($headers, [
                    'Content-Type' => 'application/json',
                ]))->timeout(20)->post($baseUrl . '/order-status', [
                    'order_id' => $orderId,
                ]),
                fn () => Http::withHeaders($headers)->timeout(20)
                    ->get($baseUrl . '/order-status', ['order_id' => $orderId]),
                fn () => Http::withHeaders($headers)->timeout(20)
                    ->get($baseUrl . '/get-order-minimal/' . urlencode($orderId)),
                fn () => Http::withHeaders(array_merge($headers, [
                    'Content-Type' => 'application/json',
                ]))->timeout(20)->post($baseUrl . '/get-order-minimal', [
                    'order_id' => $orderId,
                ]),
            ];

            $last = ['success' => false, 'paid' => false, 'failed' => false];

            foreach ($attempts as $index => $attempt) {
                $response = $attempt();
                $data = $response->json() ?? [];
                $parsed = $this->parseGatewayResponse($data);

                Log::info('Oweru order-status attempt', [
                    'order_id' => $orderId,
                    'attempt' => $index + 1,
                    'http_status' => $response->status(),
                    'paid' => $parsed['paid'],
                    'failed' => $parsed['failed'],
                    'payment_status' => $parsed['payment_status'],
                    'result' => $parsed['result'],
                    'resultcode' => $parsed['resultcode'],
                ]);

                $last = [
                    'success' => $response->successful(),
                    'paid' => $parsed['paid'],
                    'failed' => $parsed['failed'],
                    'status' => $parsed['payment_status'] ?: $parsed['result'] ?: null,
                    'data' => $data,
                ];

                if ($parsed['paid'] || $parsed['failed']) {
                    return $last;
                }
            }

            return $last;
        } catch (\Throwable $e) {
            Log::warning('Oweru order-status check failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'paid' => false, 'failed' => false];
        }
    }

    /**
     * @return array{success:bool,paid:bool,failed:bool,status?:string,data?:array<string,mixed>}
     */
    private function checkSelcomTransactionStatus(string $orderId): array
    {
        try {
            $apiKey   = config('services.selcom.api_key');
            $vendorId = config('services.selcom.vendor_id');
            $baseUrl  = config('services.selcom.base_url');

            if (! $apiKey || ! $vendorId || ! $baseUrl) {
                return ['success' => false, 'paid' => false, 'failed' => false];
            }

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'X-API-Key' => $apiKey,
            ])->timeout(30)->get($baseUrl . '/transaction/status', [
                'vendor_id' => $vendorId,
                'merchant_transaction_id' => $orderId,
            ]);

            if (! $response->successful()) {
                return ['success' => false, 'paid' => false, 'failed' => false];
            }

            $data = $response->json() ?? [];
            $parsed = $this->parseGatewayResponse($data);

            return [
                'success' => true,
                'paid' => $parsed['paid'],
                'failed' => $parsed['failed'],
                'status' => $parsed['payment_status'] ?: $parsed['result'] ?: null,
                'data' => $data,
            ];
        } catch (\Throwable $e) {
            Log::warning('Selcom transaction/status check failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'paid' => false, 'failed' => false];
        }
    }

    /**
     * Parse Selcom / Oweru gateway JSON. "SUCCESS" on result alone means USSD sent — not paid.
     *
     * @param  array<string,mixed>  $data
     * @return array{paid:bool,failed:bool,payment_status:string,result:string,resultcode:string}
     */
    private function parseGatewayResponse(array $data): array
    {
        $paymentStatus = '';
        $result = '';
        $resultCode = '';

        foreach ($this->collectPayloadLayers($data) as $layer) {
            if (($layer['paid'] ?? false) === true || ($layer['is_paid'] ?? false) === true) {
                return [
                    'paid' => true,
                    'failed' => false,
                    'payment_status' => 'PAID',
                    'result' => $result,
                    'resultcode' => $resultCode,
                ];
            }

            if ($paymentStatus === '') {
                $paymentStatus = strtoupper((string) (
                    $layer['payment_status']
                    ?? $layer['order_status']
                    ?? $layer['status']
                    ?? ''
                ));
            }
            if ($result === '') {
                $result = strtoupper((string) ($layer['result'] ?? ''));
            }
            if ($resultCode === '') {
                $resultCode = (string) ($layer['resultcode'] ?? $layer['result_code'] ?? '');
            }
        }

        $pendingStatuses = ['', 'PENDING', 'INPROGRESS', 'IN_PROGRESS', 'PROCESSING', 'INITIATED', 'REQUESTED', 'AWAITING'];

        $paid = in_array($paymentStatus, ['COMPLETED', 'COMPLETE', 'PAID', 'SUCCESSFUL'], true)
            || (
                $resultCode === '000'
                && $result === 'SUCCESS'
                && ! in_array($paymentStatus, $pendingStatuses, true)
            );

        $failed = in_array($paymentStatus, ['FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'ERROR', 'DECLINED'], true)
            || ($result === 'FAIL' || $result === 'FAILED')
            || in_array($resultCode, ['001', '002', '403'], true);

        return [
            'paid' => $paid,
            'failed' => $failed && ! $paid,
            'payment_status' => $paymentStatus,
            'result' => $result,
            'resultcode' => $resultCode,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function collectPayloadLayers(array $data): array
    {
        $layers = [$data];

        if (isset($data['data']) && is_array($data['data'])) {
            if (array_is_list($data['data'])) {
                foreach ($data['data'] as $item) {
                    if (is_array($item)) {
                        $layers[] = $item;
                    }
                }
            } else {
                $layers[] = $data['data'];
            }
        }

        foreach (['order', 'payment', 'transaction'] as $key) {
            if (isset($data[$key]) && is_array($data[$key])) {
                $layers[] = $data[$key];
            }
        }

        return $layers;
    }
}
