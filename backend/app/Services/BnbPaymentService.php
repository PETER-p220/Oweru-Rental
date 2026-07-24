<?php

namespace App\Services;

use App\Models\BnbBooking;
use App\Models\BnbProperty;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class BnbPaymentService
{
    public function __construct(
        private SelcomPaymentService $selcom,
        private NotificationService $notifications,
    ) {}

    /**
     * @return array{success:bool,message?:string,data?:array<string,mixed>}
     */
    public function initiateMobile(User $user, BnbBooking $booking, string $phoneNumber, string $provider): array
    {
        if ((int) $booking->guest_id !== (int) $user->id) {
            return ['success' => false, 'message' => 'Unauthorized'];
        }

        if ($booking->payment_status === 'paid') {
            return [
                'success' => false,
                'message' => 'This booking is already paid.',
                'data' => ['booking_id' => $booking->id, 'payment_status' => 'paid'],
            ];
        }

        if ($booking->status === 'cancelled') {
            return ['success' => false, 'message' => 'This booking was cancelled.'];
        }

        $property = $booking->property ?? BnbProperty::find($booking->property_id);
        if (! $property) {
            return ['success' => false, 'message' => 'Property not found for this booking.'];
        }

        $amount = max(100, (int) round((float) $booking->total_price));
        $orderId = 'BNB-' . $booking->id . '-' . time();
        $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Guest';

        $result = $this->selcom->initiate([
            'amount' => $amount,
            'phone_number' => $phoneNumber,
            'provider' => strtoupper($provider),
            'customer_email' => $user->email ?: "{$user->id}@oweru.com",
            'customer_name' => $name,
            'order_id' => $orderId,
            'payment_type' => 'bnb_booking',
            'property_id' => (int) $property->id,
            'tenant_id' => (int) $user->id,
        ]);

        if (! ($result['success'] ?? false)) {
            return $result;
        }

        $booking->update([
            'transaction_id' => $orderId,
            'payment_method' => strtolower($provider),
            'payment_status' => 'pending',
        ]);

        return [
            'success' => true,
            'message' => $result['message'] ?? 'Payment request sent. Approve the prompt on your phone.',
            'data' => [
                'order_id' => $orderId,
                'booking_id' => $booking->id,
                'payment_status' => 'pending',
                'provider' => strtoupper($provider),
                'payment_mode' => 'mobile_money',
            ],
        ];
    }

    /**
     * @return array{success:bool,message?:string,data?:array<string,mixed>}
     */
    public function initiateBank(User $user, BnbBooking $booking, ?string $phoneNumber = null): array
    {
        if ((int) $booking->guest_id !== (int) $user->id) {
            return ['success' => false, 'message' => 'Unauthorized'];
        }

        if ($booking->payment_status === 'paid') {
            return [
                'success' => false,
                'message' => 'This booking is already paid.',
                'data' => ['booking_id' => $booking->id, 'payment_status' => 'paid'],
            ];
        }

        if ($booking->status === 'cancelled') {
            return ['success' => false, 'message' => 'This booking was cancelled.'];
        }

        $property = $booking->property ?? BnbProperty::find($booking->property_id);
        if (! $property) {
            return ['success' => false, 'message' => 'Property not found for this booking.'];
        }

        $amount = max(100, (int) round((float) $booking->total_price));
        $orderId = 'BNB-' . $booking->id . '-' . time();
        $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Guest';
        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');

        $result = $this->selcom->initiateHostedCheckout([
            'amount' => $amount,
            'phone_number' => $phoneNumber ?: ($user->phone ?: '255700000000'),
            'customer_email' => $user->email ?: "{$user->id}@oweru.com",
            'customer_name' => $name,
            'order_id' => $orderId,
            'payment_type' => 'bnb_booking',
            'return_url' => "{$frontend}/bnb/payment/return?order_id={$orderId}&booking_id={$booking->id}",
        ]);

        if (! ($result['success'] ?? false)) {
            return $result;
        }

        $booking->update([
            'transaction_id' => $orderId,
            'payment_method' => 'bank',
            'payment_status' => 'pending',
        ]);

        return [
            'success' => true,
            'message' => $result['message'] ?? 'Continue to bank/card checkout.',
            'data' => array_merge($result['data'] ?? [], [
                'booking_id' => $booking->id,
                'order_id' => $orderId,
            ]),
        ];
    }

    /**
     * @return array{success:bool,message?:string,payment_status?:string,booking_id?:int}
     */
    public function checkStatus(string $orderId, ?User $user = null): array
    {
        $booking = BnbBooking::with('property', 'guest')
            ->where('transaction_id', $orderId)
            ->first();

        if (! $booking) {
            return ['success' => false, 'message' => 'Payment record not found.'];
        }

        if ($user && (int) $booking->guest_id !== (int) $user->id) {
            return ['success' => false, 'message' => 'Unauthorized'];
        }

        $booking->refresh();

        if ($booking->payment_status === 'paid') {
            return $this->statusResponse($booking, 'paid');
        }

        if ($booking->payment_status === 'failed') {
            return $this->statusResponse($booking, 'failed');
        }

        $remote = $this->selcom->checkOrderStatus($orderId);

        if ($remote['paid'] ?? false) {
            $this->confirmPayment($booking, $remote);

            return $this->statusResponse($booking->fresh(), 'paid');
        }

        if ($remote['failed'] ?? false) {
            $booking->update(['payment_status' => 'failed']);

            return $this->statusResponse($booking->fresh(), 'failed');
        }

        return $this->statusResponse($booking, 'pending');
    }

    public function confirmByOrderId(string $orderId, array $meta = []): bool
    {
        $booking = BnbBooking::with('property', 'guest')
            ->where('transaction_id', $orderId)
            ->first();

        if (! $booking) {
            return false;
        }

        if ($booking->payment_status !== 'paid') {
            $this->confirmPayment($booking, $meta);
        }

        return true;
    }

    public function confirmPayment(BnbBooking $booking, array $meta = []): void
    {
        if ($booking->payment_status === 'paid') {
            return;
        }

        $property = $booking->property ?? BnbProperty::find($booking->property_id);
        $status = ($property && ($property->instant_book ?? false)) ? 'confirmed' : 'pending';

        $booking->update([
            'payment_status' => 'paid',
            'status' => $booking->status === 'cancelled' ? $booking->status : $status,
        ]);

        $booking->refresh();
        $title = $property?->title ?? 'your stay';

        if ($booking->guest_id) {
            $this->notifications->notifyUser(
                $booking->guest_id,
                'BnB payment confirmed',
                "Payment for {$title} ({$booking->check_in->format('d M')} → {$booking->check_out->format('d M')}) was successful.",
                'bnb_payment_confirmed',
                true,
                rtrim((string) config('app.frontend_url', ''), '/') . '/dashboard/tenant/bnb-stays',
            );
        }

        if ($property?->owner_id) {
            $guestName = trim(($booking->guest?->first_name ?? '') . ' ' . ($booking->guest?->last_name ?? ''))
                ?: ($booking->guest?->email ?? 'A guest');

            $this->notifications->notifyUser(
                $property->owner_id,
                'Paid BnB booking',
                "{$guestName} paid for {$title} ({$booking->check_in->format('d M')} – {$booking->check_out->format('d M')}).",
                'bnb_booking_paid',
                true,
            );
        }

        Log::info('BnB booking payment confirmed', [
            'booking_id' => $booking->id,
            'order_id' => $booking->transaction_id,
            'property_id' => $booking->property_id,
            'meta' => $meta,
        ]);
    }

    /**
     * @return array{success:bool,payment_status:string,booking_id:int,message?:string}
     */
    private function statusResponse(BnbBooking $booking, string $status): array
    {
        return [
            'success' => true,
            'payment_status' => $status,
            'booking_id' => $booking->id,
            'message' => match ($status) {
                'paid' => 'Payment confirmed. Your stay is booked.',
                'failed' => 'Payment was not completed.',
                default => 'Waiting for payment confirmation.',
            },
        ];
    }
}
