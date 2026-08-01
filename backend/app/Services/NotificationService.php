<?php

namespace App\Services;

use App\Mail\RentDueReminderMail;
use App\Mail\BnbBookingCancelledMail;
use App\Mail\SystemNotificationMail;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\BnbBooking;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class NotificationService
{
    /**
     * In-app notification + optional email (when SMTP/real mailer is configured).
     */
    public function notifyUser(
        int|User $user,
        string $title,
        string $message,
        string $type = 'general',
        bool $sendEmail = true,
        ?string $actionUrl = null,
    ): ?Notification {
        $user = $user instanceof User ? $user : User::find($user);
        if (! $user) {
            return null;
        }

        try {
            $notification = Notification::create([
                'user_id' => $user->id,
                'title' => $title,
                'message' => $message,
                'type' => $type,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to create in-app notification', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            return null;
        }

        if ($sendEmail) {
            $this->sendNotificationEmail($user, $title, $message, $actionUrl);
        }

        return $notification;
    }

    public function emailNotificationsEnabled(): bool
    {
        if (! config('mail.notifications_enabled', true)) {
            return false;
        }

        $mailer = config('mail.default', 'log');

        return ! in_array($mailer, ['log', 'array'], true);
    }

    public function sendNotificationEmail(User $user, string $title, string $message, ?string $actionUrl = null): void
    {
        if (! $this->emailNotificationsEnabled() || ! $user->email) {
            return;
        }

        $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: 'there';
        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');

        try {
            Mail::to($user->email)->send(new SystemNotificationMail([
                'recipient_name' => $name,
                'title' => $title,
                'message' => $message,
                'action_url' => $actionUrl ?? ($frontend ?: null),
            ]));
        } catch (\Throwable $e) {
            Log::error('Failed to send notification email', [
                'user_id' => $user->id,
                'email' => $user->email,
                'type' => $title,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Welcome message after a new account is created (email + in-app bell).
     */
    public function sendWelcomeNotification(User $user, bool $signedUpWithGoogle = false): ?Notification
    {
        $roleLabels = [
            'tenant' => 'Tenant',
            'landlord' => 'Landlord',
            'agent' => 'Agent',
            'bnb_owner' => 'BnB Host',
            'commercial' => 'Commercial',
            'admin' => 'Admin',
        ];
        $role = $roleLabels[$user->user_type] ?? ucfirst(str_replace('_', ' ', (string) $user->user_type));

        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');
        $dashboardUrl = $frontend && $user->user_type
            ? "{$frontend}/dashboard/{$user->user_type}"
            : $frontend;

        $title = 'Welcome to Oweru';

        if ($signedUpWithGoogle) {
            $message = "Your {$role} account is ready. You signed up with Google ({$user->email}). "
                . 'Visit your dashboard to explore listings and add your phone number in Settings when you can.';
        } else {
            $message = "Your {$role} account is ready. Visit your dashboard to explore properties and manage your account.";
        }

        return $this->notifyUser($user, $title, $message, 'welcome', true, $dashboardUrl ?: null);
    }

    /**
     * Send payment confirmation notification
     */
    public function sendPaymentConfirmation(Payment $payment): ?Notification
    {
        $user = User::find($payment->user_id);
        $property = $payment->property;
        if (! $user || ! $property) {
            return null;
        }

        $amount = number_format($payment->amount, 2);
        $title = 'Payment Confirmed';
        $message = "Your payment of Tsh $amount for {$property->title} has been successfully processed.";

        if ($payment->type === 'first_month_rent') {
            $message .= ' Your lease will be activated shortly.';
        } elseif ($payment->type === 'monthly_rent') {
            $nextDueDate = $payment->due_date?->addMonth()->format('d M Y');
            $message .= " Your next payment is due on $nextDueDate.";
        }

        return $this->notifyUser($user, $title, $message, 'payment_confirmation');
    }

    /**
     * Send application approved notification
     */
    public function sendApplicationApproved($application): ?Notification
    {
        $property = $application->property;
        $rentAmount = number_format($application->offered_rent ?? $property->price, 2);

        return $this->notifyUser(
            $application->user_id,
            'Application Approved',
            "Great news! Your application for {$property->title} has been approved. "
            . "Pay the first month's rent (Tsh $rentAmount) to activate your lease.",
            'application_approved',
        );
    }

    /**
     * Send application rejected notification
     */
    public function sendApplicationRejected($application): ?Notification
    {
        $property = $application->property;

        return $this->notifyUser(
            $application->user_id,
            'Application Rejected',
            "Your application for {$property->title} was rejected. "
            . 'You can apply for other properties on Oweru Rental.',
            'application_rejected',
        );
    }

    /**
     * Send contract activated notification
     */
    public function sendContractActivated(Tenant $tenant): ?Notification
    {
        $property = $tenant->property;
        $moveInDate = $tenant->lease_start_date?->format('d M Y') ?? now()->format('d M Y');

        return $this->notifyUser(
            $tenant->user_id,
            'Contract Activated',
            "Your rental contract for {$property->title} is now active. Lease starts {$moveInDate}.",
            'contract_activated',
        );
    }

    /**
     * Ten-day reminder before the next rental period payment is due (email + in-app).
     */
    public function sendTenDayRentPeriodReminder(Payment $payment): bool
    {
        return $this->sendRentPeriodReminder($payment, 10);
    }

    /**
     * Professional rent-period reminder (email + in-app) N days before due date.
     */
    public function sendRentPeriodReminder(Payment $payment, int $daysRemaining): bool
    {
        $payment->loadMissing('property', 'user');
        $user = $payment->user;
        $property = $payment->property;

        if (! $user || ! $property || ! $payment->due_date) {
            return false;
        }

        $metadata = $payment->metadata ?? [];
        $sentKey = "reminder_{$daysRemaining}d_sent_at";
        if (! empty($metadata[$sentKey])) {
            return false;
        }

        $daysUntilDue = (int) now()->startOfDay()->diffInDays($payment->due_date->copy()->startOfDay(), false);
        if ($daysUntilDue !== $daysRemaining) {
            return false;
        }

        $dueAmount = number_format((float) $payment->amount, 0);
        $dueDate = $payment->due_date->format('d M Y');
        $periodLabel = $payment->due_date->format('F Y');
        $tenantName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: ($user->email ?? 'Tenant');
        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');
        $paymentsUrl = $frontend ? "{$frontend}/dashboard/tenant/payments" : null;

        $title = match ($daysRemaining) {
            1 => 'Rent due tomorrow',
            3 => 'Rent due in 3 days',
            default => 'Rent period ending in 10 days',
        };

        $message = match ($daysRemaining) {
            1 => "Your rent for {$property->title} ({$periodLabel}) — TZS {$dueAmount} — is due tomorrow ({$dueDate}). Please pay on time to avoid interruption.",
            3 => "Your rent for {$property->title} ({$periodLabel}) — TZS {$dueAmount} — is due in 3 days on {$dueDate}.",
            default => "Your next rent for {$property->title} ({$periodLabel}) is TZS {$dueAmount}, due on {$dueDate}. Pay on time to continue your rental without interruption.",
        };

        $this->notifyUser($user, $title, $message, 'rent_period_reminder', false, $paymentsUrl);

        if ($user->email && $this->emailNotificationsEnabled()) {
            try {
                Mail::to($user->email)->send(new RentDueReminderMail([
                    'tenant_name' => $tenantName,
                    'property_title' => $property->title ?? 'Your property',
                    'amount' => $dueAmount,
                    'due_date' => $dueDate,
                    'days_remaining' => $daysRemaining,
                    'period_label' => $periodLabel,
                    'payments_url' => $paymentsUrl,
                ]));
            } catch (\Throwable $e) {
                Log::error('Failed to send rent reminder email', [
                    'payment_id' => $payment->id,
                    'user_id' => $user->id,
                    'days_remaining' => $daysRemaining,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $payment->update([
            'metadata' => array_merge($metadata, [
                $sentKey => now()->toIso8601String(),
            ]),
        ]);

        if ($daysRemaining === 10 && Schema::hasColumn('payments', 'is_reminder_sent')) {
            $payment->update(['is_reminder_sent' => true]);
        }

        return true;
    }

    /**
     * Notify guest that a short-stay booking was cancelled (payment not completed).
     */
    public function sendBnbBookingCancelled(BnbBooking $booking, string $reason): void
    {
        $booking->loadMissing('property', 'guest');
        $guest = $booking->guest;
        $property = $booking->property;

        if (! $guest) {
            return;
        }

        $guestName = trim(($guest->first_name ?? '') . ' ' . ($guest->last_name ?? '')) ?: 'Guest';
        $frontend = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', config('app.url'))), '/');
        $browseUrl = $frontend ? "{$frontend}/#bnb" : null;
        $title = $property?->title ?? 'Short stay';
        $dates = $booking->check_in && $booking->check_out
            ? $booking->check_in->format('d M Y') . ' → ' . $booking->check_out->format('d M Y')
            : 'your selected dates';

        $this->notifyUser(
            $guest->id,
            'Booking cancelled',
            "Your booking for {$title} ({$dates}) was cancelled. {$reason}",
            'bnb_booking_cancelled',
            false,
            $browseUrl,
        );

        if ($guest->email && $this->emailNotificationsEnabled()) {
            try {
                Mail::to($guest->email)->send(new BnbBookingCancelledMail([
                    'guest_name' => $guestName,
                    'property_title' => $title,
                    'check_in' => $booking->check_in?->format('d M Y') ?? '—',
                    'check_out' => $booking->check_out?->format('d M Y') ?? '—',
                    'reason' => $reason,
                    'browse_url' => $browseUrl,
                ]));
            } catch (\Throwable $e) {
                Log::error('Failed to send BnB cancellation email', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Send monthly rent reminder (legacy / overdue path).
     */
    public function sendMonthlyReminder(Payment $payment): void
    {
        $user = $payment->user;
        if (! $user) {
            $tenant = $payment->tenant_id ? Tenant::find($payment->tenant_id) : null;
            $user = $tenant?->user;
        }
        if (! $user || ! $payment->due_date) {
            return;
        }

        $property = $payment->property;
        if (! $property) {
            return;
        }

        $daysUntilDue = now()->startOfDay()->diffInDays($payment->due_date->copy()->startOfDay(), false);
        $dueAmount = number_format((float) $payment->amount, 0);
        $dueDate = $payment->due_date->format('d M Y');

        $title = 'Monthly rent reminder';
        $message = "Your monthly rent payment of Tsh {$dueAmount} for {$property->title} is due on {$dueDate}.";

        if ($daysUntilDue > 0) {
            $message .= " ({$daysUntilDue} days remaining)";
        } elseif ($daysUntilDue === 0) {
            $title = 'Rent due today';
            $message = "Your monthly rent payment of Tsh {$dueAmount} for {$property->title} is due TODAY.";
        } else {
            $title = 'Overdue rent payment';
            $message = "Your monthly rent payment of Tsh {$dueAmount} for {$property->title} is OVERDUE since {$dueDate}. "
                . 'Please pay immediately.';
        }

        $this->notifyUser($user, $title, $message, 'rent_reminder');

        if (Schema::hasColumn('payments', 'is_reminder_sent')) {
            $payment->update(['is_reminder_sent' => true]);
        }
    }

    /**
     * Send payment failed notification
     */
    public function sendPaymentFailed(Payment $payment): ?Notification
    {
        $property = $payment->property;
        $amount = number_format($payment->amount, 2);

        return $this->notifyUser(
            $payment->user_id,
            'Payment Failed',
            "Your payment of Tsh $amount for {$property->title} failed. Please try again or contact support.",
            'payment_failed',
        );
    }

    /**
     * Send service charge reminder
     */
    public function sendServiceChargeReminder(Tenant $tenant, float $serviceCharge): ?Notification
    {
        $amount = number_format($serviceCharge, 2);
        $property = $tenant->property;

        return $this->notifyUser(
            $tenant->user_id,
            'Service Charge Payment',
            "Please pay the service charge of Tsh $amount for {$property->title}.",
            'service_charge_reminder',
        );
    }

    /**
     * Send notification to property owner
     */
    public function notifyOwner(int $ownerId, string $title, string $message, string $type = 'general'): ?Notification
    {
        return $this->notifyUser($ownerId, $title, $message, $type);
    }

    /**
     * Send new application notification to owner
     */
    public function notifyOwnerNewApplication($application): ?Notification
    {
        $tenant = $application->user;
        $property = $application->property;
        $rentOffer = number_format($application->offered_rent ?? $property->price, 2);
        $tenantName = trim(($tenant->first_name ?? '') . ' ' . ($tenant->last_name ?? '')) ?: ($tenant->email ?? 'A tenant');

        return $this->notifyOwner(
            $property->owner_id,
            'New Application',
            "New rental application from {$tenantName} for {$property->title}. Offered rent: Tsh $rentOffer.",
            'new_application',
        );
    }

    /**
     * Get all notifications for user
     */
    public function getUserNotifications(int $userId, int $limit = 20): array
    {
        return Notification::where('user_id', $userId)
            ->where(function ($query) {
                $query->whereNull('archived_at');
            })
            ->latest()
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId): bool
    {
        return Notification::find($notificationId)->update(['read_at' => now()]);
    }

    /**
     * Archive notification
     */
    public function archiveNotification(int $notificationId): bool
    {
        return Notification::find($notificationId)->update(['archived_at' => now()]);
    }

    /**
     * Delete old notifications
     */
    public function deleteOldNotifications(int $daysOld = 90): int
    {
        return Notification::where('created_at', '<', now()->subDays($daysOld))
            ->delete();
    }
}
