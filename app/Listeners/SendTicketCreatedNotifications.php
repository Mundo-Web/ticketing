<?php

namespace App\Listeners;

use App\Events\TicketCreated;
use App\Jobs\SendTicketCreatedEmailsJob;

class SendTicketCreatedNotifications
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(TicketCreated $event): void
    {
        // Dispatch job to send emails after HTTP response
        SendTicketCreatedEmailsJob::dispatchAfterResponse($event->ticket);
    }
}
