<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Notification;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class SiteVisitPaymentService
{
    public const SERVICE_FEE = 20000;

    public function __construct(
        private SelcomPaymentService $selcom
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
            'amount' => self::SERVICE_FEE,
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
            'service_fee' => self::SERVICE_FEE,
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
            return false;
        }

        $this->confirmPayment($application, $meta);

        return true;
    }

    public function confirmPayment(Application $application, array $meta = []): void
    {
        if ($application->payment_status === 'paid') {
            return;
        }

        $application->update([
            'payment_status' => 'paid',
            'service_fee' => self::SERVICE_FEE,
        ]);

        $application->loadMissing('property', 'user');
        $property = $application->property;

        if ($property?->agent_id) {
            $this->notifyAgent($property, $application, $meta);
        }

        $this->notifyTenant($application, $property);

        Log::info('Site visit payment confirmed', [
            'application_id' => $application->id,
            'order_id' => $application->transaction_id,
            'property_id' => $application->property_id,
        ]);
    }

    private function notifyTenant(Application $application, ?Property $property): void
    {
        $userId = $application->user_id;
        if (! $userId) {
            return;
        }

        $title = $property?->title ?? 'your selected property';

        try {
            Notification::create([
                'user_id' => $userId,
                'title' => 'Site Visit Fee Confirmed',
                'message' => "Your TZS " . number_format(self::SERVICE_FEE) .
                    " site visit payment for {$title} was received. The agent will contact you to schedule a visit.",
                'type' => 'site_visit_paid',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to create tenant site visit notification', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function notifyAgent(Property $property, Application $application, array $meta = []): void
    {
        $agentId = $property->agent_id;
        if (! $agentId) {
            return;
        }

        $tenantName = trim(($application->user->first_name ?? '') . ' ' . ($application->user->last_name ?? ''))
            ?: ($application->user->email ?? 'A tenant');
        $provider = strtoupper($application->payment_method ?? ($meta['provider'] ?? 'MOBILE MONEY'));

        try {
            Notification::create([
                'user_id' => $agentId,
                'title' => 'Site Visit Fee Paid',
                'message' => "{$tenantName} paid the TZS " . number_format(self::SERVICE_FEE) .
                    " site visit fee via {$provider} for {$property->title}. Please contact them to schedule a visit.",
                'type' => 'site_visit_paid',
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to create agent site visit notification', [
                'agent_id' => $agentId,
                'error' => $e->getMessage(),
            ]);
        }
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
