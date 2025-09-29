<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationDispatcherService;
use Illuminate\Notifications\DatabaseNotification;

class TestTechnicalNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:technical-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test technical data in notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== VERIFICANDO DATOS TÉCNICOS EN NOTIFICACIONES ===');
        
        // Mostrar últimas notificaciones
        $this->info('Últimas 3 notificaciones:');
        $notifications = DatabaseNotification::latest()->take(3)->get();
        
        foreach ($notifications as $notification) {
            $data = is_array($notification->data) ? $notification->data : json_decode($notification->data, true);
            $this->line("ID: {$notification->id}");
            $this->line("Type: " . ($data['type'] ?? 'null'));
            $this->line("Technical ID: " . ($data['technical_id'] ?? 'null'));
            $this->line("Technical Name: " . ($data['technical_name'] ?? 'null'));
            $this->line("Created: " . $notification->created_at);
            $this->line('---');
        }
        
        $this->info('=== CREANDO TEST DE COMENTARIO ===');
        
        // Buscar un ticket con técnico
        $ticket = Ticket::whereNotNull('technical_id')
            ->with(['technical', 'user', 'device.name_device'])
            ->first();
            
        if (!$ticket) {
            $this->error('No se encontró ticket con técnico asignado');
            return;
        }
        
        $this->info("Test Ticket: {$ticket->code}");
        $this->info("Technical: {$ticket->technical->name}");
        $this->info("Technical ID: {$ticket->technical->id}");
        
        // Usar un usuario diferente para comentar
        $testUser = User::where('id', '!=', $ticket->user_id)->first();
        
        if (!$testUser) {
            $this->error('No se encontró usuario para testing');
            return;
        }
        
        $this->info("Comment by: {$testUser->name}");
        
        // Ejecutar el servicio
        $service = new NotificationDispatcherService();
        $service->dispatchTicketCommentAdded($ticket, 'Test comment with technical data', $testUser);
        
        $this->info('Test notification created!');
        
        $this->info('=== TESTING APPOINTMENT NOTIFICATIONS ===');
        
        // Buscar una cita para probar
        $appointment = \App\Models\Appointment::with(['ticket', 'technical', 'scheduledBy'])->first();
        if ($appointment) {
            $this->info("Testing appointment: {$appointment->id}");
            $this->info("Ticket: {$appointment->ticket->code}");
            $this->info("Technical: " . ($appointment->technical ? $appointment->technical->name : 'None'));
            $this->info("Scheduled by: " . ($appointment->scheduledBy ? $appointment->scheduledBy->name : 'None'));
            
            // Ejecutar el servicio de notificaciones de appointment
            $service->dispatchAppointmentCreated($appointment);
            $this->info('Appointment notification dispatched!');
        } else {
            $this->info('No appointments found for testing');
        }
        
        // Mostrar la nueva notificación
        $this->info('Nueva notificación creada:');
        $newNotification = DatabaseNotification::latest()->first();
        $data = is_array($newNotification->data) ? $newNotification->data : json_decode($newNotification->data, true);
        
        $this->line("ID: {$newNotification->id}");
        $this->line("Type: " . ($data['type'] ?? 'null'));
        $this->line("Technical ID: " . ($data['technical_id'] ?? 'null'));
        $this->line("Technical Name: " . ($data['technical_name'] ?? 'null'));
        $this->line("Device Name: " . ($data['device_name'] ?? 'null'));
        $this->line("Appointment Title: " . ($data['appointment_title'] ?? 'null'));
        $this->line("Created By: " . ($data['created_by'] ?? 'null'));
        $this->line("Message: " . ($data['message'] ?? 'null'));
    }
}
