<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Services\CommissionShareService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class SendMonthlyRentReminders extends Command
{
    protected $signature = 'reminders:send-monthly-rent';

    protected $description = 'Send rent period reminders (10, 3, and 1 day before due) to tenants via email and in-app';

    /** @var list<int> */
    private const REMINDER_DAYS = [10, 3, 1];

    public function __construct(
        private NotificationService $notificationService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $rentTypes = CommissionShareService::RENT_TYPES;
        $totalSent = 0;

        foreach (self::REMINDER_DAYS as $days) {
            $dueOn = now()->addDays($days)->toDateString();
            $this->info("Checking pending rent payments due in {$days} day(s) ({$dueOn})…");

            $payments = Payment::query()
                ->whereIn('type', $rentTypes)
                ->where('status', 'pending')
                ->whereDate('due_date', $dueOn)
                ->with(['user', 'property', 'tenant'])
                ->get();

            $this->info("Found {$payments->count()} payment(s) for {$days}-day reminder");

            foreach ($payments as $payment) {
                try {
                    if ($this->notificationService->sendRentPeriodReminder($payment, $days)) {
                        $totalSent++;
                        $email = $payment->user?->email ?? 'unknown';
                        $this->info("{$days}-day reminder sent for payment #{$payment->id} ({$email})");
                    }
                } catch (\Exception $e) {
                    $this->error("Failed payment #{$payment->id}: {$e->getMessage()}");
                }
            }
        }

        $this->info("Done. Sent {$totalSent} reminder(s).");

        return 0;
    }
}
