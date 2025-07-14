<?php

namespace App\Listeners;

use App\Events\TicketCommentAdded;
use App\Jobs\SendTicketCommentEmailsJob;

class SendTicketCommentNotifications
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
    public function handle(TicketCommentAdded $event): void
    {
        // Dispatch job to send emails after HTTP response
        SendTicketCommentEmailsJob::dispatchAfterResponse($event->comment);
    }
}
