<?php

namespace App\Listeners;

use App\Events\TicketStatusChanged;
use App\Jobs\SendTicketStatusChangedEmailsJob;

class SendTicketStatusChangedNotifications
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
    public function handle(TicketStatusChanged $event): void
    {
        // Dispatch job to send emails after HTTP response
        SendTicketStatusChangedEmailsJob::dispatchAfterResponse(
            $event->ticket,
            $event->oldStatus,
            $event->newStatus,
            $event->changedBy
        );
    }
}
