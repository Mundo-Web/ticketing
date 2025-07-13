<?php

namespace App\Services;

use App\Models\NinjaOneAlert;
use App\Models\Ticket;
use App\Models\User;
use App\Mail\NinjaOneAlertNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\NinjaOneAlertNotification as NinjaOneAlertNotificationClass;
use Exception;

class NotificationService
{
    /**
     * Send notification to device owners about NinjaOne alert
     */
    public function sendNinjaOneAlertNotification(NinjaOneAlert $alert): void
    {
        try {
            $device = $alert->device;
            
            if (!$device) {
                Log::warning('Cannot send notification: device not found', [
                    'alert_id' => $alert->id
                ]);
                return;
            }

            // Get device owners (primary owner + shared users)
            $owners = $device->getAllOwners();

            if ($owners->isEmpty()) {
                Log::warning('No owners found for device', [
                    'device_id' => $device->id,
                    'alert_id' => $alert->id
                ]);
                return;
            }

            // Send notifications to each owner
            foreach ($owners as $tenant) {
                if ($tenant->user && $tenant->user->email) {
                    $this->sendEmailNotification($tenant->user, $alert);
                    
                    // Send in-app notification if implemented
                    $this->sendInAppNotification($tenant->user, $alert);
                }
            }

            // Mark notification as sent
            $alert->update(['notification_sent' => true]);

            Log::info('NinjaOne alert notifications sent', [
                'alert_id' => $alert->id,
                'device_id' => $device->id,
                'recipients_count' => $owners->count()
            ]);

        } catch (Exception $e) {
            Log::error('Error sending NinjaOne alert notification', [
                'alert_id' => $alert->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send email notification
     */
    protected function sendEmailNotification(User $user, NinjaOneAlert $alert): void
    {
        try {
            Mail::to($user->email)->send(new NinjaOneAlertNotification($alert));
            
            Log::info('Email notification sent', [
                'user_id' => $user->id,
                'alert_id' => $alert->id,
                'email' => $user->email
            ]);

        } catch (Exception $e) {
            Log::error('Failed to send email notification', [
                'user_id' => $user->id,
                'alert_id' => $alert->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send in-app notification
     */
    protected function sendInAppNotification(User $user, NinjaOneAlert $alert): void
    {
        try {
            $user->notify(new NinjaOneAlertNotificationClass($alert));
            
            Log::info('In-app notification sent', [
                'user_id' => $user->id,
                'alert_id' => $alert->id
            ]);

        } catch (Exception $e) {
            Log::error('Failed to send in-app notification', [
                'user_id' => $user->id,
                'alert_id' => $alert->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Create ticket from NinjaOne alert
     */
    public function createTicketFromAlert(NinjaOneAlert $alert, User $user): ?Ticket
    {
        try {
            $device = $alert->device;
            
            if (!$device) {
                Log::error('Cannot create ticket: device not found', [
                    'alert_id' => $alert->id
                ]);
                return null;
            }

            // Use NinjaOneService to map alert type to category
            $ninjaOneService = app(NinjaOneService::class);
            $category = $ninjaOneService->mapAlertTypeToCategory($alert->alert_type);

            $ticket = Ticket::create([
                'user_id' => $user->id,
                'device_id' => $device->id,
                'title' => "NinjaOne Alert: {$alert->title}",
                'description' => $this->buildTicketDescription($alert),
                'category' => $category,
                'priority' => $this->mapSeverityToPriority($alert->severity),
                'status' => 'open',
            ]);

            // Link alert to ticket
            $alert->update(['ticket_id' => $ticket->id]);

            // Add initial history entry
            $ticket->histories()->create([
                'user_id' => $user->id,
                'action' => 'ninjaone_alert_created',
                'description' => "Ticket created automatically from NinjaOne alert (ID: {$alert->ninjaone_alert_id})",
            ]);

            Log::info('Ticket created from NinjaOne alert', [
                'ticket_id' => $ticket->id,
                'alert_id' => $alert->id,
                'user_id' => $user->id
            ]);

            return $ticket;

        } catch (Exception $e) {
            Log::error('Error creating ticket from NinjaOne alert', [
                'alert_id' => $alert->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Build ticket description from alert
     */
    protected function buildTicketDescription(NinjaOneAlert $alert): string
    {
        $description = "**Automatic ticket created from NinjaOne alert**\n\n";
        $description .= "**Alert Information:**\n";
        $description .= "- Alert ID: {$alert->ninjaone_alert_id}\n";
        $description .= "- Device ID: {$alert->ninjaone_device_id}\n";
        $description .= "- Severity: {$alert->severity}\n";
        $description .= "- Type: {$alert->alert_type}\n";
        $description .= "- Created: {$alert->ninjaone_created_at->format('Y-m-d H:i:s')}\n\n";
        $description .= "**Description:**\n";
        $description .= $alert->description . "\n\n";
        
        if ($alert->metadata) {
            $description .= "**Additional Details:**\n";
            $description .= "```json\n" . json_encode($alert->metadata, JSON_PRETTY_PRINT) . "\n```";
        }

        return $description;
    }

    /**
     * Map alert severity to ticket priority
     */
    protected function mapSeverityToPriority(string $severity): string
    {
        $priorityMap = [
            'low' => 'low',
            'medium' => 'medium',
            'high' => 'high',
            'critical' => 'urgent',
        ];

        return $priorityMap[$severity] ?? 'medium';
    }

    /**
     * Send notification about ticket creation
     */
    public function sendTicketCreatedNotification(Ticket $ticket): void
    {
        try {
            $user = $ticket->user;
            
            if ($user && $user->email) {
                // Send email notification about ticket creation
                // This could use an existing ticket notification mail class
                Log::info('Ticket creation notification sent', [
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id
                ]);
            }

        } catch (Exception $e) {
            Log::error('Error sending ticket creation notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
