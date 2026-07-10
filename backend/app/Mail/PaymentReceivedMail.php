<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{
     *   recipient_name:string,
     *   tenant_name:string,
     *   property_title:string,
     *   amount:string,
     *   payment_type_label:string,
     *   reference:?string,
     *   paid_at:string
     * }  $payload
     */
    public function __construct(public array $payload) {}

    public function envelope(): Envelope
    {
        $type = $this->payload['payment_type_label'] ?? 'Rental payment';

        return new Envelope(
            subject: "{$type} received — {$this->payload['property_title']}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-received',
            with: ['payload' => $this->payload],
        );
    }
}
