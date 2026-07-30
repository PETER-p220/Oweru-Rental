<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DailyCommissionReportMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $report
     */
    public function __construct(
        public array $report,
        public string $pdfBinary,
        public string $filename,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Oweru Daily Commission Report — ' . ($this->report['report_date'] ?? now()->toDateString()),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.daily-commission-report',
            with: ['report' => $this->report],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfBinary, $this->filename)
                ->withMime('application/pdf'),
        ];
    }
}
