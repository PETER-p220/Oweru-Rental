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
     *   period_label:string
     * }  $payload
     */
    public function __construct(public array $payload) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Rent due in {$this->payload['days_remaining']} days — {$this->payload['property_title']}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.rent-due-reminder',
            with: ['payload' => $this->payload],
        );
    }
}
