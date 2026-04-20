<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\Tenant;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendMonthlyRentReminders extends Command
{
    protected $signature = 'reminders:send-monthly-rent';
    protected $description = 'Send monthly rent payment reminders to tenants';

    private $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    public function handle(): int
    {
        $this->info('Starting monthly rent reminder process...');

        try {
            // Get all pending monthly rent payments due within the next 7 days
            $upcomingPayments = Payment::where('type', 'monthly_rent')
                ->where('status', 'pending')
                ->whereNull('is_reminder_sent')
                ->orWhere('is_reminder_sent', false)
                ->whereBetween('due_date', [
                    now(),
                    now()->addDays(7)
                ])
                ->with('tenant', 'property')
                ->get();

            $this->info("Found {$upcomingPayments->count()} payments due within 7 days");

            foreach ($upcomingPayments as $payment) {
                if (!$payment->tenant) {
                    continue;
                }

                try {
                    $this->notificationService->sendMonthlyReminder($payment->tenant, $payment);
                    $this->info("Reminder sent for tenant: {$payment->tenant->user->email}");
                } catch (\Exception $e) {
                    $this->error("Failed to send reminder for payment {$payment->id}: {$e->getMessage()}");
                }
            }

            // Also send reminders for overdue payments
            $overduePayments = Payment::where('type', 'monthly_rent')
                ->where('status', 'pending')
                ->where('due_date', '<', now())
                ->with('tenant', 'property')
                ->get();

            $this->info("Found {$overduePayments->count()} overdue payments");

            foreach ($overduePayments as $payment) {
                if (!$payment->tenant) {
                    continue;
                }

                try {
                    $this->notificationService->sendMonthlyReminder($payment->tenant, $payment);
                    $this->info("Overdue reminder sent for tenant: {$payment->tenant->user->email}");
                } catch (\Exception $e) {
                    $this->error("Failed to send overdue reminder for payment {$payment->id}: {$e->getMessage()}");
                }
            }

            $this->info('Monthly rent reminder process completed successfully.');
            return 0;
        } catch (\Exception $e) {
            $this->error('Error in reminder process: ' . $e->getMessage());
            return 1;
        }
    }
}
