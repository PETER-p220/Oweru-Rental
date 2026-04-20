<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Send payment confirmation notification
     */
    public function sendPaymentConfirmation(Payment $payment): Notification
    {
        $user = User::find($payment->user_id);
        $property = $payment->property;

        $amount = number_format($payment->amount, 2);
        $title = 'Payment Confirmed';
        $message = "Your payment of Tsh $amount for {$property->title} has been successfully processed.";

        if ($payment->type === 'first_month_rent') {
            $message .= " Your lease will be activated shortly.";
        } elseif ($payment->type === 'monthly_rent') {
            $nextDueDate = $payment->due_date?->addMonth()->format('d M Y');
            $message .= " Your next payment is due on $nextDueDate.";
        }

        return Notification::create([
            'user_id' => $payment->user_id,
            'title' => $title,
            'message' => $message,
            'type' => 'payment_confirmation',
        ]);
    }

    /**
     * Send application approved notification
     */
    public function sendApplicationApproved($application): Notification
    {
        $property = $application->property;
        $rentAmount = number_format($application->offered_rent ?? $property->price, 2);

        return Notification::create([
            'user_id' => $application->user_id,
            'title' => 'Application Approved 🎉',
            'message' => "Great news! Your application for {$property->title} has been approved by the owner. " .
                        "You need to pay the first month's rent (Tsh $rentAmount) to activate your lease.",
            'type' => 'application_approved',
        ]);
    }

    /**
     * Send application rejected notification
     */
    public function sendApplicationRejected($application): Notification
    {
        $property = $application->property;

        return Notification::create([
            'user_id' => $application->user_id,
            'title' => 'Application Rejected',
            'message' => "Unfortunately, your application for {$property->title} has been rejected. " .
                        "Feel free to apply for other properties on our platform.",
            'type' => 'application_rejected',
        ]);
    }

    /**
     * Send contract activated notification
     */
    public function sendContractActivated(Tenant $tenant): Notification
    {
        $property = $tenant->property;
        $moveInDate = $tenant->lease_start_date?->format('d M Y') ?? now()->format('d M Y');

        return Notification::create([
            'user_id' => $tenant->user_id,
            'title' => 'Contract Activated ✅',
            'message' => "Congratulations! Your rental contract for {$property->title} is now active. " .
                        "Your lease starts from $moveInDate.",
            'type' => 'contract_activated',
        ]);
    }

    /**
     * Send monthly rent reminder
     */
    public function sendMonthlyReminder(Payment $payment): void
    {
        $tenant = Tenant::find($payment->tenant_id);
        if (!$tenant) return;

        $daysUntilDue = now()->diffInDays($payment->due_date, false);
        $dueAmount = number_format($payment->amount, 2);
        $dueDate = $payment->due_date->format('d M Y');

        $title = '📅 Monthly Rent Reminder';
        $message = "Your monthly rent payment of Tsh $dueAmount for {$tenant->property->title} is due on $dueDate.";

        if ($daysUntilDue > 0) {
            $message .= " ({$daysUntilDue} days remaining)";
        } elseif ($daysUntilDue === 0) {
            $title = '⏰ Rent Due Today';
            $message = "Your monthly rent payment of Tsh $dueAmount for {$tenant->property->title} is due TODAY.";
        } elseif ($daysUntilDue < 0) {
            $title = '⚠️ Overdue Payment';
            $message = "Your monthly rent payment of Tsh $dueAmount for {$tenant->property->title} is OVERDUE since $dueDate. " .
                      "Please make payment immediately.";
        }

        Notification::create([
            'user_id' => $tenant->user_id,
            'title' => $title,
            'message' => $message,
            'type' => 'rent_reminder',
        ]);

        // Mark reminder as sent
        $payment->update(['is_reminder_sent' => true]);
    }

    /**
     * Send payment failed notification
     */
    public function sendPaymentFailed(Payment $payment): Notification
    {
        $property = $payment->property;
        $amount = number_format($payment->amount, 2);

        return Notification::create([
            'user_id' => $payment->user_id,
            'title' => 'Payment Failed ❌',
            'message' => "Your payment of Tsh $amount for {$property->title} failed. " .
                        "Please try again or contact support.",
            'type' => 'payment_failed',
        ]);
    }

    /**
     * Send service charge reminder
     */
    public function sendServiceChargeReminder(Tenant $tenant, float $serviceCharge): Notification
    {
        $amount = number_format($serviceCharge, 2);
        $property = $tenant->property;

        return Notification::create([
            'user_id' => $tenant->user_id,
            'title' => 'Service Charge Payment',
            'message' => "Please pay the service charge of Tsh $amount for {$property->title}. " .
                        "This fee covers maintenance and platform services.",
            'type' => 'service_charge_reminder',
        ]);
    }

    /**
     * Send notification to property owner
     */
    public function notifyOwner(int $ownerId, string $title, string $message, string $type = 'general'): Notification
    {
        return Notification::create([
            'user_id' => $ownerId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ]);
    }

    /**
     * Send new application notification to owner
     */
    public function notifyOwnerNewApplication($application): Notification
    {
        $tenant = $application->user;
        $property = $application->property;
        $rentOffer = number_format($application->offered_rent ?? $property->price, 2);

        return $this->notifyOwner(
            $property->owner_id,
            'New Application 📝',
            "New rental application from {$tenant->name} for {$property->title}. " .
            "Offered rent: Tsh $rentOffer. Review and approve/reject the application.",
            'new_application'
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
