<?php

namespace App\Listeners;

use App\Events\AppointmentRescheduled;
use App\Events\NotificationCreated;
use App\Notifications\AppointmentRescheduledNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class HandleAppointmentRescheduled
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
    public function handle(AppointmentRescheduled $event): void
    {
        $appointment = $event->appointment;
        $oldDateTime = $event->oldDateTime;
        $newDateTime = $event->newDateTime;
        
        // Cargar las relaciones necesarias
        $appointment->load(['technical', 'ticket.user']);

        if (!$appointment->technical || !$appointment->ticket || !$appointment->ticket->user) {
            Log::warning("Missing technical or member for rescheduled appointment {$appointment->id}");
            return;
        }

        // Obtener el usuario correspondiente al técnico por email
        $technicalUser = \App\Models\User::where('email', $appointment->technical->email)->first();
        if (!$technicalUser) {
            Log::warning("No user found for technical email: {$appointment->technical->email}");
            return;
        }

        Log::info("📅 Appointment rescheduled - sending notifications and scheduling new reminders for appointment {$appointment->id}");
        Log::info("🔄 Rescheduled from {$oldDateTime} to {$newDateTime}");

        // 1. Crear y enviar notificación de reagendamiento al técnico
        $technicalNotification = new AppointmentRescheduledNotification($appointment, $oldDateTime, $newDateTime, 'technical');
        $technicalUser->notify($technicalNotification);
        Log::info("📧 Technical notification saved to database for user {$technicalUser->id}");

        // 2. Crear y enviar notificación de reagendamiento al cliente
        $memberNotification = new AppointmentRescheduledNotification($appointment, $oldDateTime, $newDateTime, 'member');
        $appointment->ticket->user->notify($memberNotification);
        Log::info("📧 Member notification saved to database for user {$appointment->ticket->user->id}");

        // 3. Enviar las notificaciones por broadcasting (obtener de DB y enviar)
        $this->broadcastDatabaseNotifications($technicalUser, $appointment->ticket->user);

        // 4. Programar nuevos recordatorios para la nueva hora (solo broadcasting de recordatorios)
        $this->scheduleNewReminders($appointment, $newDateTime, $technicalUser);
    }

    /**
     * Broadcast database notifications that were just created
     */
    protected function broadcastDatabaseNotifications($technicalUser, $memberUser)
    {
        // Obtener la última notificación del técnico y enviarla por broadcasting
        $technicalNotification = $technicalUser->notifications()->latest()->first();
        if ($technicalNotification) {
            event(new NotificationCreated($technicalNotification, $technicalUser->id));
            Log::info("📡 Technical notification broadcasted for user {$technicalUser->id}");
        }

        // Obtener la última notificación del cliente y enviarla por broadcasting
        $memberNotification = $memberUser->notifications()->latest()->first();
        if ($memberNotification) {
            event(new NotificationCreated($memberNotification, $memberUser->id));
            Log::info("📡 Member notification broadcasted for user {$memberUser->id}");
        }
    }

    /**
     * Schedule new appointment reminders
     */
    protected function scheduleNewReminders($appointment, $newDateTime, $technicalUser)
    {
        $appointmentTime = Carbon::parse($newDateTime);
        $now = Carbon::now();
        
        // Solo programar recordatorios si la nueva cita está en el futuro
        if ($appointmentTime->gt($now)) {
            $reminderIntervals = [5, 4, 3, 2, 1];

            // Enviar recordatorios inmediatos para cada intervalo
            foreach ($reminderIntervals as $minutes) {
                $reminderTime = $appointmentTime->copy()->subMinutes($minutes);
                
                // Solo enviar recordatorios que aún no han pasado
                if ($reminderTime->gt($now)) {
                    $timeText = $minutes === 0 ? 'ahora' : "en {$minutes} minutos";
                    $urgency = $minutes <= 2 ? 'high' : 'medium';

                    // Notificación al técnico
                    broadcast(new NotificationCreated([
                        'type' => 'appointment_reminder',
                        'title' => '🔔 Recordatorio de Cita Reagendada',
                        'message' => "Tu cita reagendada como técnico iniciará {$timeText}: {$appointment->title}",
                        'data' => [
                            'appointment_id' => $appointment->id,
                            'minutes_before' => $minutes,
                            'urgency' => $urgency,
                            'appointment_title' => $appointment->title,
                            'appointment_address' => $appointment->address,
                            'ticket_code' => $appointment->ticket->code,
                            'scheduled_for' => $newDateTime,
                            'reminder_time' => $reminderTime->toISOString(),
                            'is_rescheduled' => true,
                        ],
                    ], $technicalUser->id));

                    // Notificación al cliente
                    broadcast(new NotificationCreated([
                        'type' => 'appointment_reminder',
                        'title' => '🔔 Recordatorio de Cita Reagendada',
                        'message' => "Tu cita reagendada como cliente iniciará {$timeText}: {$appointment->title}",
                        'data' => [
                            'appointment_id' => $appointment->id,
                            'minutes_before' => $minutes,
                            'urgency' => $urgency,
                            'appointment_title' => $appointment->title,
                            'appointment_address' => $appointment->address,
                            'ticket_code' => $appointment->ticket->code,
                            'scheduled_for' => $newDateTime,
                            'reminder_time' => $reminderTime->toISOString(),
                            'is_rescheduled' => true,
                        ],
                    ], $appointment->ticket->user->id));

                    Log::info("� Sent rescheduled reminder for {$minutes} minutes before appointment {$appointment->id}");
                } else {
                    Log::info("� Skipped rescheduled reminder for {$minutes} minutes before appointment {$appointment->id} (time already passed)");
                }
            }

            Log::info("📱 All rescheduled appointment reminders sent for both technical #{$technicalUser->id} and member #{$appointment->ticket->user->id}");
        } else {
            Log::info("⏰ Rescheduled appointment is in the past, no reminders scheduled");
        }
    }
}
