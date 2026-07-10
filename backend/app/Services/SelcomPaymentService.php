<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SelcomPaymentService
{
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
        $appKey = env('OWERU_APP_KEY');
        $baseUrl = 'https://api.selcom.oweru.com/api/checkout';

        if (empty($appKey)) {
            Log::error('Missing OWERU_APP_KEY in .env');

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

        Log::info('Oweru create-order-minimal request', ['payload' => $createPayload]);

        $createResponse = Http::withHeaders([
            'X-App-Key' => $appKey,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->post($baseUrl . '/create-order-minimal', $createPayload);

        $createData = $createResponse->json();

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
            $appKey = env('OWERU_APP_KEY');
            $baseUrl = 'https://api.selcom.oweru.com/api/checkout';

            if (empty($appKey)) {
                return ['success' => false, 'paid' => false, 'failed' => false];
            }

            $response = Http::withHeaders([
                'X-App-Key' => $appKey,
                'Accept' => 'application/json',
            ])->timeout(20)->get($baseUrl . '/order-status/' . urlencode($orderId));

            if (! $response->successful()) {
                $response = Http::withHeaders([
                    'X-App-Key' => $appKey,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])->timeout(20)->post($baseUrl . '/order-status', ['order_id' => $orderId]);
            }

            $data = $response->json() ?? [];
            $parsed = $this->parseGatewayResponse($data);

            Log::info('Oweru order-status response', [
                'order_id' => $orderId,
                'http_status' => $response->status(),
                'paid' => $parsed['paid'],
                'failed' => $parsed['failed'],
                'payment_status' => $parsed['payment_status'],
                'result' => $parsed['result'],
                'resultcode' => $parsed['resultcode'],
            ]);

            return [
                'success' => $response->successful(),
                'paid' => $parsed['paid'],
                'failed' => $parsed['failed'],
                'status' => $parsed['payment_status'] ?: $parsed['result'] ?: null,
                'data' => $data,
            ];
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
        $payload = $data;
        if (isset($data['data']) && is_array($data['data']) && ! isset($data['data'][0])) {
            $payload = array_merge($data, $data['data']);
        } elseif (isset($data['data'][0]) && is_array($data['data'][0])) {
            $payload = array_merge($data, $data['data'][0]);
        }

        $paymentStatus = strtoupper((string) (
            $payload['payment_status']
            ?? $payload['order_status']
            ?? $payload['status']
            ?? ''
        ));
        $result = strtoupper((string) ($payload['result'] ?? ''));
        $resultCode = (string) ($payload['resultcode'] ?? $payload['result_code'] ?? '');

        // Paid only when payment_status is definitively completed (not wallet-push SUCCESS)
        $paid = in_array($paymentStatus, ['COMPLETED', 'COMPLETE', 'PAID', 'SUCCESSFUL'], true)
            || ($resultCode === '000' && $paymentStatus === 'COMPLETED');

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
}
