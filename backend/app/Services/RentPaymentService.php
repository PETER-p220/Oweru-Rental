<?php

namespace App\Services;

use App\Models\Application;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class RentPaymentService
{
    public function __construct(
        private SelcomPaymentService $selcom,
        private PaymentAlertService $alerts,
    ) {}

    /**
     * @return array{success:bool,message?:string,data?:array<string,mixed>}
     */
    public function initiate(User $user, Application $application, string $phoneNumber, string $provider): array
    {
        $application->loadMissing('property');

        if ($application->user_id !== $user->id) {
            return ['success' => false, 'message' => 'Unauthorized'];
        }

        if ($application->status !== 'approved') {
            return [
                'success' => false,
                'message' => 'Rent can only be paid after your application is approved.',
            ];
        }

        $property = $application->property;
        if (! $property) {
            return ['success' => false, 'message' => 'Property not found for this application.'];
        }

        if ($property->available === false) {
            return [
                'success' => false,
                'message' => 'This property is no longer available for rent.',
            ];
        }

        if ($property->agent_id && $application->payment_status !== 'paid') {
            return [
                'success' => false,
                'message' => 'Please complete the site visit fee payment before paying rent.',
            ];
        }

        if ($application->rent_payment_status === 'paid') {
            return [
                'success' => false,
                'message' => 'Rent has already been paid for this application.',
                'data' => ['rent_payment_status' => 'paid'],
            ];
        }

        $rentAmount = (float) ($application->offered_rent ?? $property->price ?? 0);
        if ($rentAmount <= 0) {
            return ['success' => false, 'message' => 'Unable to determine rent amount.'];
        }

        $orderId = 'RENT-' . $application->id . '-' . $user->id . '-' . time();

        $result = $this->selcom->initiate([
            'amount' => $rentAmount,
            'phone_number' => $phoneNumber,
            'provider' => strtoupper($provider),
            'customer_email' => $user->email ?: "{$user->id}@oweru.com",
            'customer_name' => trim($user->first_name . ' ' . $user->last_name) ?: 'Tenant',
            'order_id' => $orderId,
            'payment_type' => 'rent_payment',
            'property_id' => $property->id,
            'tenant_id' => $user->id,
        ]);

        if (! ($result['success'] ?? false)) {
            return $result;
        }

        $application->update([
            'rent_payment_status' => 'pending',
            'rent_payment_method' => strtolower($provider),
            'rent_transaction_id' => $orderId,
            'amount_paid' => null,
        ]);

        return [
            'success' => true,
            'message' => $result['message'] ?? 'Payment request sent. Approve the prompt on your phone.',
            'data' => [
                'order_id' => $orderId,
                'application_id' => $application->id,
                'amount' => $rentAmount,
                'rent_payment_status' => 'pending',
            ],
        ];
    }

    /**
     * @return array{success:bool,message?:string,rent_payment_status?:string,application_id?:int}
     */
    public function checkStatus(string $orderId, ?User $user = null): array
    {
        $application = Application::with('property', 'user')
            ->where('rent_transaction_id', $orderId)
            ->first();

        if (! $application) {
            return ['success' => false, 'message' => 'Rent payment record not found.'];
        }

        if ($user && $application->user_id !== $user->id) {
            return ['success' => false, 'message' => 'Unauthorized'];
        }

        $application->refresh();

        if ($application->rent_payment_status === 'paid') {
            return $this->statusResponse($application, 'paid');
        }

        if ($application->rent_payment_status === 'failed') {
            return $this->statusResponse($application, 'failed');
        }

        $remote = $this->selcom->checkOrderStatus($orderId);

        if ($remote['paid'] ?? false) {
            $this->confirmPayment($application, $remote);

            return $this->statusResponse($application->fresh(), 'paid');
        }

        if ($remote['failed'] ?? false) {
            $application->update(['rent_payment_status' => 'failed']);

            return $this->statusResponse($application->fresh(), 'failed');
        }

        return $this->statusResponse($application, 'pending');
    }

    public function confirmByOrderId(string $orderId, array $meta = []): bool
    {
        $application = Application::with('property')
            ->where('rent_transaction_id', $orderId)
            ->first();

        if (! $application || $application->rent_payment_status === 'paid') {
            return false;
        }

        $this->confirmPayment($application, $meta);

        return true;
    }

    public function confirmPayment(Application $application, array $meta = []): void
    {
        if ($application->rent_payment_status === 'paid') {
            return;
        }

        $application->loadMissing('property', 'user');
        $rentAmount = (float) ($application->offered_rent ?? $application->property?->price ?? 0);

        $application->update([
            'rent_payment_status' => 'paid',
            'amount_paid' => $rentAmount > 0 ? $rentAmount : $application->amount_paid,
        ]);

        // Take the listing offline so other tenants cannot apply or pay for it.
        $property = $application->property;
        if ($property && $property->available !== false) {
            $property->update(['available' => false]);
        }

        // Close competing open applications for the same property.
        if ($property) {
            Application::where('property_id', $property->id)
                ->where('id', '!=', $application->id)
                ->whereNotIn('status', ['withdrawn', 'rejected', 'contract_active'])
                ->where(function ($q) {
                    $q->whereNull('rent_payment_status')
                        ->orWhere('rent_payment_status', '!=', 'paid');
                })
                ->update(['status' => 'rejected']);
        }

        $this->alerts->handleRentPaid($application->fresh(['property', 'user']));

        Log::info('Rent payment confirmed', [
            'application_id' => $application->id,
            'order_id' => $application->rent_transaction_id,
            'property_id' => $property?->id,
            'property_available' => false,
        ]);
    }

    private function statusResponse(Application $application, string $status): array
    {
        return [
            'success' => true,
            'rent_payment_status' => $status,
            'application_id' => $application->id,
            'rent_paid' => $status === 'paid',
            'message' => match ($status) {
                'paid' => 'Rent payment confirmed.',
                'failed' => 'Rent payment was not completed.',
                default => 'Waiting for payment approval on your phone.',
            },
        ];
    }
}
