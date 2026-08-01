<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RentDueReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{
     *   tenant_name:string,
     *   property_title:string,
     *   amount:string,
     *   due_date:string,
     *   days_remaining:int,
     *   period_label:string,
     *   payments_url?:string|null
     * }  $payload
     */
    public function __construct(public array $payload) {}

    public function envelope(): Envelope
    {
        $days = (int) ($this->payload['days_remaining'] ?? 10);
        $property = $this->payload['property_title'];

        $subject = match ($days) {
            1 => "Action required: rent due tomorrow — {$property}",
            3 => "Rent due in 3 days — {$property}",
            default => "Rent reminder: payment due in 10 days — {$property}",
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.rent-due-reminder',
            with: ['payload' => $this->payload],
        );
    }
}
