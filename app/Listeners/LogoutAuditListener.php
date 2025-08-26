<?php

namespace App\Listeners;

use App\Models\AuditLog;
use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Request as RequestFacade;

class LogoutAuditListener
{
    /**
     * Handle the event.
     */
    public function handle(Logout $event): void
    {
        $request = RequestFacade::instance();
        $sessionId = session()->getId();
        
        // Verificar si ya existe un registro de logout para esta sesión
        $existingLog = AuditLog::where('session_id', $sessionId)
            ->where('action_type', 'logout')
            ->where('user_id', $event->user->id)
            ->where('created_at', '>=', now()->subMinutes(1))
            ->first();
            
        // Si ya existe un registro reciente, no crear otro
        if ($existingLog) {
            return;
        }
        
        AuditLog::create([
            'user_id' => $event->user->id,
            'action_type' => 'logout',
            'model_type' => null,
            'model_id' => null,
            'old_values' => null,
            'new_values' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => session()->getId(),
            'description' => 'User logged out successfully',
            'route' => $request->route()?->getName() ?? $request->path(),
            'method' => $request->method(),
            'request_data' => [
                'url' => $request->fullUrl(),
                'parameters' => [],
                'response_status' => 200,
                'execution_time_ms' => 0,
                'referer' => $request->header('referer'),
                'guard' => $event->guard,
            ],
        ]);
    }
}