<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CheckAppointmentReminders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Solo ejecutar si no se ha ejecutado en el último minuto
        $cacheKey = 'last_reminder_check';
        $lastCheck = Cache::get($cacheKey);
        
        if (!$lastCheck || Carbon::parse($lastCheck)->addMinute()->lte(Carbon::now())) {
            $this->checkReminders();
            Cache::put($cacheKey, Carbon::now()->toISOString(), 120); // Cache por 2 minutos
        }
        
        return $next($request);
    }

    /**
     * Verificar y disparar recordatorios
     */
    private function checkReminders()
    {
        try {
            // Consultar citas próximas (esto dispara el event 'retrieved' en el modelo)
            $upcomingAppointments = Appointment::where('status', Appointment::STATUS_SCHEDULED)
                ->where('scheduled_for', '>=', Carbon::now())
                ->where('scheduled_for', '<=', Carbon::now()->addMinutes(6)) // Solo próximas 6 minutos
                ->get();

            Log::info("🔍 Middleware: Checked {$upcomingAppointments->count()} upcoming appointments for reminders");
            
            // Verificar manualmente cada cita para recordatorios
            foreach ($upcomingAppointments as $appointment) {
                $appointment->checkAndSendReminders();
            }
            
        } catch (\Exception $e) {
            Log::error("Error in CheckAppointmentReminders middleware: " . $e->getMessage());
        }
    }
}