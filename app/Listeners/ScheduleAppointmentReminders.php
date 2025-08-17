<?php

namespace App\Listeners;

use App\Events\AppointmentCreated;
use App\Events\NotificationCreated;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ScheduleAppointmentReminders
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
    public function handle(AppointmentCreated $event): void
    {
        $appointment = $event->appointment;
        $appointmentTime = Carbon::parse($appointment->scheduled_for);
        $now = Carbon::now();
        
        // Cargar las relaciones necesarias
        $appointment->load(['technical', 'ticket.user']);

        if (!$appointment->technical || !$appointment->ticket || !$appointment->ticket->user) {
            Log::warning("Missing technical or member for appointment {$appointment->id}");
            return;
        }

        // Obtener el usuario correspondiente al técnico por email
        $technicalUser = \App\Models\User::where('email', $appointment->technical->email)->first();
        if (!$technicalUser) {
            Log::warning("No user found for technical email: {$appointment->technical->email}");
            return;
        }

        Log::info("📅 New appointment created - sending immediate reminders for appointment {$appointment->id} at {$appointmentTime}");

        // Definir los intervalos de recordatorio (en minutos antes de la cita)
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
                    'title' => '🔔 Recordatorio de Cita',
                    'message' => "Tu cita como técnico iniciará {$timeText}: {$appointment->title}",
                    'data' => [
                        'appointment_id' => $appointment->id,
                        'minutes_before' => $minutes,
                        'urgency' => $urgency,
                        'appointment_title' => $appointment->title,
                        'appointment_address' => $appointment->address,
                        'ticket_code' => $appointment->ticket->code,
                        'scheduled_for' => $appointment->scheduled_for,
                        'reminder_time' => $reminderTime->toISOString(),
                    ],
                ], $technicalUser->id));

                // Notificación al cliente
                broadcast(new NotificationCreated([
                    'type' => 'appointment_reminder',
                    'title' => '🔔 Recordatorio de Cita',
                    'message' => "Tu cita como cliente iniciará {$timeText}: {$appointment->title}",
                    'data' => [
                        'appointment_id' => $appointment->id,
                        'minutes_before' => $minutes,
                        'urgency' => $urgency,
                        'appointment_title' => $appointment->title,
                        'appointment_address' => $appointment->address,
                        'ticket_code' => $appointment->ticket->code,
                        'scheduled_for' => $appointment->scheduled_for,
                        'reminder_time' => $reminderTime->toISOString(),
                    ],
                ], $appointment->ticket->user->id));

                Log::info("� Sent reminder for {$minutes} minutes before appointment {$appointment->id} to both users");
            } else {
                Log::info("� Skipped reminder for {$minutes} minutes before appointment {$appointment->id} (time already passed)");
            }
        }

        Log::info("📱 All appointment reminders sent successfully for appointment {$appointment->id}");
    }
}
