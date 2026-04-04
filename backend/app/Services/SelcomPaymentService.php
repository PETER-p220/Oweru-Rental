<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class SelcomPaymentService
{
    private $baseUrl;
    private $vendorId;
    private $apiKey;
    private $apiSecret;
    private $isLive;

    public function __construct()
    {
        $this->baseUrl = config('services.selcom.base_url', 'https://apigw.selcommobile.com/v1');
        $this->vendorId = config('services.selcom.vendor_id', 'TILL61224964');
        $this->apiKey = config('services.selcom.api_key', 'TILL61224964-df0113d1e78347e2bb40d17592c47387');
        $this->apiSecret = config('services.selcom.api_secret', '05a99d-ef40c7-46359a-76a9ad-5438e9-5d');
        $this->isLive = config('services.selcom.live', true);
    }

    /**
     * Generate unique order ID
     */
    private function generateOrderId(): string
    {
        return 'OWERU_' . time() . '_' . substr(md5(uniqid()), 0, 8);
    }

    /**
     * Generate HMAC signature for Selcom API
     */
    private function generateSignature(array $data): string
    {
        // Sort data by key
        ksort($data);
        
        // Create string to sign
        $stringToSign = '';
        foreach ($data as $key => $value) {
            if ($key !== 'signature') {
                $stringToSign .= $key . $value;
            }
        }
        
        // Generate HMAC-SHA256 signature
        return hash_hmac('sha256', $stringToSign, $this->apiSecret);
    }

    /**
     * Initiate Selcom checkout payment
     */
    public function initiatePayment(array $paymentData): array
    {
        try {
            $orderId = $this->generateOrderId();
            
            $requestBody = [
                'amount' => $paymentData['amount'],
                'currency' => 'TZS',
                'vendor_id' => $this->vendorId,
                'order_id' => $orderId,
                'customer_email' => $paymentData['customer_email'] ?? null,
                'customer_phone' => $paymentData['customer_phone'] ?? null,
                'customer_name' => $paymentData['customer_name'] ?? 'Customer',
                'redirect_url' => config('app.url') . '/payment/success',
                'webhook_url' => config('app.url') . '/api/payment/webhook',
                'created_at' => Carbon::now()->toISOString(),
            ];

            // Add signature
            $requestBody['signature'] = $this->generateSignature($requestBody);

            Log::info('Initiating Selcom payment', [
                'order_id' => $orderId,
                'amount' => $paymentData['amount'],
                'vendor_id' => $this->vendorId,
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->apiKey,
                'X-Vendor-ID' => $this->vendorId,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/payments/checkout', $requestBody);

            Log::info('Selcom payment response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                if (isset($result['success']) && $result['success']) {
                    return [
                        'success' => true,
                        'data' => [
                            'payment_url' => $result['data']['payment_url'] ?? null,
                            'transaction_id' => $result['data']['transaction_id'] ?? $orderId,
                            'order_id' => $orderId,
                            'status' => $result['data']['status'] ?? 'pending',
                        ]
                    ];
                } else {
                    return [
                        'success' => false,
                        'error' => $result['error'] ?? 'PAYMENT_FAILED',
                        'message' => $result['message'] ?? 'Payment failed',
                    ];
                }
            } else {
                Log::error('Selcom payment HTTP error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'HTTP_ERROR',
                    'message' => 'Payment service error: ' . $response->status(),
                ];
            }

        } catch (\Exception $e) {
            Log::error('Selcom payment exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'EXCEPTION',
                'message' => 'Payment processing error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Initiate mobile money payment
     */
    public function initiateMobileMoneyPayment(array $paymentData): array
    {
        try {
            $orderId = $this->generateOrderId();
            
            $requestBody = [
                'amount' => $paymentData['amount'],
                'currency' => 'TZS',
                'vendor_id' => $this->vendorId,
                'order_id' => $orderId,
                'phone_number' => $paymentData['phone_number'],
                'provider' => strtoupper($paymentData['provider']),
                'customer_email' => $paymentData['customer_email'] ?? ($paymentData['tenant_id'] . '@oweru.com'),
                'customer_name' => $paymentData['customer_name'] ?? ('Tenant ' . $paymentData['tenant_id']),
                'webhook_url' => config('app.url') . '/api/payment/webhook',
                'redirect_url' => config('app.url') . '/payment/success',
                'created_at' => Carbon::now()->toISOString(),
            ];

            // Add signature
            $requestBody['signature'] = $this->generateSignature($requestBody);

            Log::info('Initiating Selcom mobile money payment', [
                'order_id' => $orderId,
                'amount' => $paymentData['amount'],
                'phone_number' => $paymentData['phone_number'],
                'provider' => $paymentData['provider'],
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->apiKey,
                'X-Vendor-ID' => $this->vendorId,
                'Accept' => 'application/json',
            ])->post($this->baseUrl . '/payments/mobilemoney', $requestBody);

            Log::info('Selcom mobile money response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                // Selcom mobile money API may return different response structure
                $success = $result['success'] ?? $result['status'] === 'success' ?? false;
                
                if ($success) {
                    return [
                        'success' => true,
                        'data' => [
                            'transaction_id' => $result['data']['transaction_id'] ?? $result['transaction_id'] ?? $orderId,
                            'order_id' => $orderId,
                            'status' => $result['data']['status'] ?? $result['status'] ?? 'pending',
                        ]
                    ];
                } else {
                    return [
                        'success' => false,
                        'error' => $result['error'] ?? 'MOBILE_MONEY_FAILED',
                        'message' => $result['message'] ?? $result['error_description'] ?? 'Mobile money payment failed',
                    ];
                }
            } else {
                $errorData = $response->json();
                
                Log::error('Selcom mobile money HTTP error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'HTTP_ERROR',
                    'message' => $errorData['message'] ?? 'Mobile money service error: ' . $response->status(),
                ];
            }

        } catch (\Exception $e) {
            Log::error('Selcom mobile money exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'EXCEPTION',
                'message' => 'Mobile money processing error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check payment status
     */
    public function checkPaymentStatus(string $transactionId): array
    {
        try {
            Log::info('Checking Selcom payment status', [
                'transaction_id' => $transactionId,
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->apiKey,
                'X-Vendor-ID' => $this->vendorId,
                'Accept' => 'application/json',
            ])->get($this->baseUrl . '/payments/status/' . $transactionId);

            if ($response->successful()) {
                $result = $response->json();
                
                return [
                    'success' => true,
                    'data' => [
                        'status' => $result['data']['status'] ?? $result['status'] ?? 'unknown',
                        'transaction_id' => $result['data']['transaction_id'] ?? $result['transaction_id'] ?? $transactionId,
                        'order_id' => $result['data']['order_id'] ?? $result['order_id'] ?? null,
                    ],
                    'message' => $result['message'] ?? null,
                ];
            } else {
                Log::error('Selcom status check error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'STATUS_CHECK_FAILED',
                    'message' => 'Failed to check payment status',
                ];
            }

        } catch (\Exception $e) {
            Log::error('Selcom status check exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'EXCEPTION',
                'message' => 'Status check error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Process webhook from Selcom
     */
    public function processWebhook(array $webhookData): array
    {
        try {
            Log::info('Processing Selcom webhook', [
                'webhook_data' => $webhookData,
            ]);

            // Verify webhook signature if provided
            if (isset($webhookData['signature'])) {
                $expectedSignature = $this->generateSignature($webhookData);
                if (!hash_equals($expectedSignature, $webhookData['signature'])) {
                    Log::warning('Invalid webhook signature', [
                        'expected' => $expectedSignature,
                        'received' => $webhookData['signature'],
                    ]);
                    
                    return [
                        'success' => false,
                        'error' => 'INVALID_SIGNATURE',
                        'message' => 'Invalid webhook signature',
                    ];
                }
            }

            // Extract payment information
            $transactionId = $webhookData['transaction_id'] ?? null;
            $orderId = $webhookData['order_id'] ?? null;
            $status = $webhookData['status'] ?? 'unknown';
            $amount = $webhookData['amount'] ?? 0;

            if (!$transactionId && !$orderId) {
                return [
                    'success' => false,
                    'error' => 'MISSING_TRANSACTION_INFO',
                    'message' => 'Missing transaction or order ID',
                ];
            }

            // Map Selcom statuses to our statuses
            $mappedStatus = $this->mapSelcomStatus($status);

            return [
                'success' => true,
                'data' => [
                    'transaction_id' => $transactionId,
                    'order_id' => $orderId,
                    'status' => $mappedStatus,
                    'amount' => $amount,
                    'raw_status' => $status,
                ],
                'message' => 'Webhook processed successfully',
            ];

        } catch (\Exception $e) {
            Log::error('Selcom webhook processing exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'EXCEPTION',
                'message' => 'Webhook processing error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Map Selcom payment statuses to our internal statuses
     */
    private function mapSelcomStatus(string $selcomStatus): string
    {
        $statusMap = [
            'success' => 'paid',
            'completed' => 'paid',
            'paid' => 'paid',
            'pending' => 'pending',
            'processing' => 'pending',
            'failed' => 'failed',
            'cancelled' => 'failed',
            'refunded' => 'refunded',
        ];

        return $statusMap[strtolower($selcomStatus)] ?? 'pending';
    }
}
