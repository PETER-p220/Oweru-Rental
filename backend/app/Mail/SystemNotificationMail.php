<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SystemNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{
     *   recipient_name:string,
     *   title:string,
     *   message:string,
     *   action_url?:string|null
     * }  $payload
     */
    public function __construct(public array $payload) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->payload['title'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.system-notification',
            with: ['payload' => $this->payload],
        );
    }
}
