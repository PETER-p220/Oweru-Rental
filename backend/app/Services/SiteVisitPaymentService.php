<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class SiteVisitPaymentService
{
    public static function serviceFee(): int
    {
        return (int) config('services.site_visit.fee', 200);
    }

    /** @deprecated Use serviceFee() — kept for references */
    public const SERVICE_FEE = 200;

    public function __construct(
        private SelcomPaymentService $selcom,
        private PaymentAlertService $alerts,
    ) {}

    /**
     * @return array{success:bool,message?:string,data?:array<string,mixed>}
     */
    public function initiate(User $user, Property $property, string $phoneNumber, string $provider): array
    {
        if (! $property->agent_id) {
            return [
                'success' => false,
                'message' => 'Site visit fee only applies to agent-listed properties.',
            ];
        }

        if ($property->available === false) {
            return [
                'success' => false,
                'message' => 'This property is no longer available.',
            ];
        }

        $existing = Application::where('user_id', $user->id)
            ->where('property_id', $property->id)
            ->whereNotIn('status', ['withdrawn', 'rejected'])
            ->first();

        if ($existing?->payment_status === 'paid') {
            return [
                'success' => false,
                'message' => 'You have already paid the site visit fee for this property.',
                'data' => ['application_id' => $existing->id, 'payment_status' => 'paid'],
            ];
        }

        $orderId = 'SV-' . $property->id . '-' . $user->id . '-' . time();

        $result = $this->selcom->initiate([
            'amount' => self::serviceFee(),
            'phone_number' => $phoneNumber,
            'provider' => strtoupper($provider),
            'customer_email' => $user->email ?: "{$user->id}@oweru.com",
            'customer_name' => trim($user->first_name . ' ' . $user->last_name) ?: 'Tenant',
            'order_id' => $orderId,
            'payment_type' => 'site_visit',
            'property_id' => $property->id,
            'tenant_id' => $user->id,
        ]);

        if (! ($result['success'] ?? false)) {
            return $result;
        }

        $payload = [
            'owner_id' => $property->owner_id,
            'message' => "Site visit request for {$property->title}",
            'service_fee' => self::serviceFee(),
            'payment_status' => 'pending',
            'payment_method' => strtolower($provider),
            'transaction_id' => $orderId,
            'applied_at' => now(),
        ];

        if ($existing) {
            $existing->update($payload);
            $application = $existing->fresh();
        } else {
            $application = Application::create(array_merge($payload, [
                'user_id' => $user->id,
                'property_id' => $property->id,
                'status' => 'pending',
            ]));
        }

        return [
            'success' => true,
            'message' => $result['message'] ?? 'Payment request sent. Approve the prompt on your phone.',
            'data' => [
                'order_id' => $orderId,
                'application_id' => $application->id,
                'payment_status' => 'pending',
                'provider' => strtoupper($provider),
            ],
        ];
    }

    /**
     * @return array{success:bool,message?:string,payment_status?:string,application_id?:int}
     */
    public function checkStatus(string $orderId, ?User $user = null): array
    {
        $application = Application::with('property.agent', 'user')
            ->where('transaction_id', $orderId)
            ->first();

        if (! $application) {
            return ['success' => false, 'message' => 'Payment record not found.'];
        }

        if ($user && $application->user_id !== $user->id) {
            return ['success' => false, 'message' => 'Unauthorized'];
        }

        $application->refresh();

        if ($application->payment_status === 'paid') {
            return $this->statusResponse($application, 'paid');
        }

        if ($application->payment_status === 'failed') {
            return $this->statusResponse($application, 'failed');
        }

        $remote = $this->selcom->checkOrderStatus($orderId);

        if ($remote['paid'] ?? false) {
            $this->confirmPayment($application, $remote);

            return $this->statusResponse($application->fresh(), 'paid');
        }

        if ($remote['failed'] ?? false) {
            $application->update(['payment_status' => 'failed']);

            return $this->statusResponse($application->fresh(), 'failed');
        }

        return $this->statusResponse($application, 'pending');
    }

    public function confirmByOrderId(string $orderId, array $meta = []): bool
    {
        $application = Application::with('property')
            ->where('transaction_id', $orderId)
            ->first();

        if (! $application || $application->payment_status === 'paid') {
            if ($application) {
                app(SiteVisitPostPaymentService::class)->finalize(
                    $application->fresh(['property', 'user']),
                    $meta,
                );
            }

            return $application !== null;
        }

        $this->confirmPayment($application, $meta);

        return true;
    }

    public function confirmPayment(Application $application, array $meta = []): void
    {
        if ($application->payment_status !== 'paid') {
            $application->update([
                'payment_status' => 'paid',
                'service_fee' => self::serviceFee(),
            ]);
        }

        app(SiteVisitPostPaymentService::class)->finalize(
            $application->fresh(['property', 'user']),
            $meta,
        );

        Log::info('Site visit payment confirmed', [
            'application_id' => $application->id,
            'order_id' => $application->transaction_id,
            'property_id' => $application->property_id,
        ]);
    }

    /**
     * @return array{success:bool,payment_status:string,application_id:int,message?:string}
     */
    private function statusResponse(Application $application, string $status): array
    {
        return [
            'success' => true,
            'payment_status' => $status,
            'application_id' => $application->id,
            'message' => match ($status) {
                'paid' => 'Payment confirmed.',
                'failed' => 'Payment was not completed.',
                default => 'Waiting for payment approval on your phone.',
            },
        ];
    }
}
