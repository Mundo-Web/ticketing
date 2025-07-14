<?php

namespace App\Listeners;

use App\Events\TicketAssigned;
use App\Jobs\SendTicketAssignedEmailsJob;

class SendTicketAssignedNotifications
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
    public function handle(TicketAssigned $event): void
    {
        // Dispatch job to send emails after HTTP response
        SendTicketAssignedEmailsJob::dispatchAfterResponse(
            $event->ticket,
            $event->technical,
            $event->assignedBy
        );
    }
}
