<?php

namespace App\Mail;

use App\Models\NinjaOneAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NinjaOneAlertNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $alert;

    /**
     * Create a new message instance.
     */
    public function __construct(NinjaOneAlert $alert)
    {
        $this->alert = $alert;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $severity = ucfirst($this->alert->severity);
        $deviceName = $this->alert->device->name ?? 'Unknown Device';
        
        return new Envelope(
            subject: "[{$severity}] Device Alert: {$deviceName} - {$this->alert->title}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.ninjaone-alert',
            with: [
                'alert' => $this->alert,
                'device' => $this->alert->device,
                'createTicketUrl' => route('tickets.create-from-alert', $this->alert->id),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
