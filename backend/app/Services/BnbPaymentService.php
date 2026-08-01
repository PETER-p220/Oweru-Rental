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

    public function bookingHoldMinutes(): int
    {
        return max(5, (int) config('services.payment.bnb_booking_hold_minutes', 30));
    }

    public function mobilePaymentMinutes(): int
    {
        return max(5, (int) config('services.payment.payment_timeout_minutes', 30));
    }

    public function bankCheckoutMinutes(): int
    {
        return max(15, (int) config('services.payment.bnb_bank_checkout_minutes', 60));
    }

    public function deadlineForNewBooking(): \Illuminate\Support\Carbon
    {
        return now()->addMinutes($this->bookingHoldMinutes());
    }

    public function deadlineForPaymentMode(string $mode): \Illuminate\Support\Carbon
    {
        $minutes = $mode === 'bank' ? $this->bankCheckoutMinutes() : $this->mobilePaymentMinutes();

        return now()->addMinutes($minutes);
    }

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

        if ($this->isPaymentDeadlinePassed($booking)) {
            $this->cancelForPaymentFailure($booking, 'Payment window expired before checkout could begin.');

            return ['success' => false, 'message' => 'This booking was cancelled because payment was not completed in time.'];
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
            'payment_deadline_at' => $this->deadlineForPaymentMode('mobile'),
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
                'payment_deadline_at' => $booking->fresh()->payment_deadline_at?->toIso8601String(),
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

        if ($this->isPaymentDeadlinePassed($booking)) {
            $this->cancelForPaymentFailure($booking, 'Payment window expired before checkout could begin.');

            return ['success' => false, 'message' => 'This booking was cancelled because payment was not completed in time.'];
        }

        $property = $booking->property ?? BnbProperty::find($booking->property_id);
        if (! $property) {
            return ['success' => false, 'message' => 'Property not found for this booking.'];
        }

        $amount = max(100, (int) round((float) $booking->total_price));
        $orderId = 'BNB-' . $booking->id . '-' . time();
        $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'Guest';
        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');
        $role = $user->user_type ?? 'tenant';

        $result = $this->selcom->initiateHostedCheckout([
            'amount' => $amount,
            'phone_number' => $phoneNumber ?: ($user->phone ?: '255700000000'),
            'customer_email' => $user->email ?: "{$user->id}@oweru.com",
            'customer_name' => $name,
            'order_id' => $orderId,
            'payment_type' => 'bnb_booking',
            'return_url' => "{$frontend}/dashboard/{$role}/bnb-payment-return?order_id={$orderId}&booking_id={$booking->id}",
        ]);

        if (! ($result['success'] ?? false)) {
            return $result;
        }

        $booking->update([
            'transaction_id' => $orderId,
            'payment_method' => 'bank',
            'payment_status' => 'pending',
            'payment_deadline_at' => $this->deadlineForPaymentMode('bank'),
        ]);

        return [
            'success' => true,
            'message' => $result['message'] ?? 'Continue to bank/card checkout.',
            'data' => array_merge($result['data'] ?? [], [
                'booking_id' => $booking->id,
                'order_id' => $orderId,
                'payment_deadline_at' => $booking->fresh()->payment_deadline_at?->toIso8601String(),
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

        if ($booking->status === 'cancelled') {
            return [
                'success' => true,
                'payment_status' => 'failed',
                'booking_id' => $booking->id,
                'message' => 'This booking was cancelled because payment was not completed in time.',
            ];
        }

        if ($booking->payment_status === 'paid') {
            return $this->statusResponse($booking, 'paid');
        }

        if ($booking->payment_status === 'failed') {
            return $this->statusResponse($booking, 'failed');
        }

        if ($this->isPaymentDeadlinePassed($booking)) {
            $this->cancelForPaymentFailure($booking, 'Payment was not received before the deadline.');

            return $this->statusResponse($booking->fresh(), 'failed');
        }

        $remote = $this->selcom->checkOrderStatus($orderId);

        if ($remote['paid'] ?? false) {
            $this->confirmPayment($booking, $remote);

            return $this->statusResponse($booking->fresh(), 'paid');
        }

        if ($remote['failed'] ?? false) {
            $this->cancelForPaymentFailure($booking, 'Payment was declined or not completed.');

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

        if ($booking->status === 'cancelled') {
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
            'payment_deadline_at' => null,
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

    public function cancelForPaymentFailure(BnbBooking $booking, string $reason): void
    {
        $booking->refresh();

        if ($booking->status === 'cancelled' || $booking->payment_status === 'paid') {
            return;
        }

        $booking->update([
            'status' => 'cancelled',
            'payment_status' => 'failed',
            'cancellation_reason' => $reason,
            'payment_deadline_at' => null,
        ]);

        $this->notifications->sendBnbBookingCancelled($booking->fresh(), $reason);

        Log::info('BnB booking cancelled — payment not completed', [
            'booking_id' => $booking->id,
            'reason' => $reason,
        ]);
    }

    public function cancelExpiredUnpaidBookings(): int
    {
        $bookings = BnbBooking::query()
            ->with(['property', 'guest'])
            ->where('status', 'pending')
            ->whereIn('payment_status', ['pending', 'failed'])
            ->whereNotNull('payment_deadline_at')
            ->where('payment_deadline_at', '<', now())
            ->get();

        foreach ($bookings as $booking) {
            $this->cancelForPaymentFailure(
                $booking,
                'Payment was not received within the allowed time. Your reservation has been released.'
            );
        }

        return $bookings->count();
    }

    public function isPaymentDeadlinePassed(BnbBooking $booking): bool
    {
        return $booking->payment_deadline_at
            && $booking->payment_deadline_at->isPast()
            && $booking->payment_status !== 'paid'
            && $booking->status !== 'cancelled';
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
                'failed' => $booking->status === 'cancelled'
                    ? 'Payment was not completed. This booking has been cancelled.'
                    : 'Payment was not completed.',
                default => 'Waiting for payment confirmation.',
            },
        ];
    }
}
