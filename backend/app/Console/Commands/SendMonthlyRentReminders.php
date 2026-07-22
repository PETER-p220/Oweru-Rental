<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Services\CommissionShareService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendMonthlyRentReminders extends Command
{
    protected $signature = 'reminders:send-monthly-rent';

    protected $description = 'Send 10-day rent period reminders (email + in-app) to tenants';

    public function __construct(
        private NotificationService $notificationService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Checking pending rent payments due in 10 days…');

        $dueOn = now()->addDays(10)->toDateString();
        $rentTypes = CommissionShareService::RENT_TYPES;

        $payments = Payment::query()
            ->whereIn('type', $rentTypes)
            ->where('status', 'pending')
            ->whereDate('due_date', $dueOn)
            ->with(['user', 'property', 'tenant'])
            ->get();

        $this->info("Found {$payments->count()} payment(s) with due date {$dueOn}");

        $sent = 0;
        foreach ($payments as $payment) {
            try {
                if ($this->notificationService->sendTenDayRentPeriodReminder($payment)) {
                    $sent++;
                    $email = $payment->user?->email ?? 'unknown';
                    $this->info("10-day reminder sent for payment #{$payment->id} ({$email})");
                }
            } catch (\Exception $e) {
                $this->error("Failed payment #{$payment->id}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Sent {$sent} reminder(s).");

        return 0;
    }
}
