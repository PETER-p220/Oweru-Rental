<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BnbBookingCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array{
     *   guest_name:string,
     *   property_title:string,
     *   check_in:string,
     *   check_out:string,
     *   reason:string,
     *   browse_url?:string|null
     * }  $payload
     */
    public function __construct(public array $payload) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Booking cancelled — {$this->payload['property_title']}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.bnb-booking-cancelled',
            with: ['payload' => $this->payload],
        );
    }
}
