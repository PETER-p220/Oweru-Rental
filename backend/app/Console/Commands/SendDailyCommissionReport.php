<?php

namespace App\Console\Commands;

use App\Mail\DailyCommissionReportMail;
use App\Services\CommissionReportService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDailyCommissionReport extends Command
{
    protected $signature = 'reports:send-daily-commissions {--date= : Report date (Y-m-d), defaults to yesterday}';

    protected $description = 'Generate and email the daily Oweru & dalali commission PDF report';

    public function handle(CommissionReportService $reports): int
    {
        if (! config('mail.notifications_enabled', true)) {
            $this->warn('Mail notifications are disabled (MAIL_NOTIFICATIONS_ENABLED=false).');

            return self::SUCCESS;
        }

        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))->startOfDay()
            : now()->subDay()->startOfDay();

        $report = $reports->buildDailyReport($date);
        $pdf = $reports->renderPdf($report);
        $filename = $reports->reportFilename($date);
        $recipient = $reports->reportRecipient();

        try {
            Mail::to($recipient)->send(new DailyCommissionReportMail($report, $pdf, $filename));
            $this->info("Daily commission report for {$date->toDateString()} sent to {$recipient}.");
        } catch (\Throwable $e) {
            Log::error('Daily commission report email failed', [
                'date' => $date->toDateString(),
                'error' => $e->getMessage(),
            ]);
            $this->error('Failed to send report: ' . $e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
