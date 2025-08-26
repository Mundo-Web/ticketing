<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class AuditMiddleware
{
    /**
     * Rutas que deben ser excluidas de la auditoría
     */
    protected $excludedRoutes = [
        'api/csrf-cookie',
        'api/user',
        'sanctum/csrf-cookie',
        '_ignition/*',
        'telescope/*',
        'horizon/*',
        'audit-logs*', // Evitar recursión infinita
    ];

    /**
     * Métodos HTTP que deben ser auditados
     */
    protected $auditedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        
        // Ejecutar la petición
        $response = $next($request);
        
        // Auditar la petición después de procesarla
        $this->auditRequest($request, $response, $startTime);
        
        return $response;
    }

    /**
     * Auditar la petición HTTP
     */
    protected function auditRequest(Request $request, Response $response, float $startTime)
    {
        // Verificar si la ruta debe ser auditada
        if (!$this->shouldAuditRoute($request)) {
            return;
        }

        // Verificar si el método HTTP debe ser auditado
        if (!$this->shouldAuditMethod($request)) {
            return;
        }

        // Verificar si la respuesta fue exitosa (códigos 2xx)
        if (!$this->isSuccessfulResponse($response)) {
            return;
        }

        $executionTime = round((microtime(true) - $startTime) * 1000, 2); // en milisegundos
        
        try {
            $this->createAuditLog($request, $response, $executionTime);
        } catch (\Exception $e) {
            // Log el error pero no interrumpir la aplicación
            \Log::error('Error creating audit log: ' . $e->getMessage());
        }
    }

    /**
     * Crear el registro de auditoría
     */
    protected function createAuditLog(Request $request, Response $response, float $executionTime)
    {
        $actionType = $this->determineActionType($request);
        $description = $this->generateDescription($request, $actionType);
        
        // Filtrar datos sensibles de la petición
        $requestData = $this->filterSensitiveData($request->all());
        
        AuditLog::create([
            'user_id' => Auth::id(),
            'action_type' => $actionType,
            'model_type' => null, // Se llenará por el trait Auditable para operaciones CRUD
            'model_id' => null,
            'old_values' => null,
            'new_values' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => session()->getId(),
            'description' => $description,
            'route' => $request->route()?->getName() ?? $request->path(),
            'method' => $request->method(),
            'request_data' => [
                'url' => $request->fullUrl(),
                'parameters' => $requestData,
                'response_status' => $response->getStatusCode(),
                'execution_time_ms' => $executionTime,
                'referer' => $request->header('referer'),
            ],
        ]);
    }

    /**
     * Determinar el tipo de acción basado en la petición
     */
    protected function determineActionType(Request $request): string
    {
        $method = $request->method();
        $path = $request->path();
        $routeName = $request->route()?->getName();

        // Acciones específicas de autenticación
        if (str_contains($path, 'login') || $routeName === 'login') {
            return 'login';
        }
        
        if (str_contains($path, 'logout') || $routeName === 'logout') {
            return 'logout';
        }

        // Acciones CRUD genéricas
        switch ($method) {
            case 'POST':
                return 'created';
            case 'PUT':
            case 'PATCH':
                return 'updated';
            case 'DELETE':
                return 'deleted';
            case 'GET':
                return 'viewed';
            default:
                return strtolower($method);
        }
    }

    /**
     * Generar descripción legible de la acción
     */
    protected function generateDescription(Request $request, string $actionType): string
    {
        $path = $request->path();
        $routeName = $request->route()?->getName();
        
        // Route-specific descriptions
        $routeDescriptions = [
            'login' => 'User logged in',
            'logout' => 'User logged out',
            'dashboard' => 'Accessed dashboard',
            
            // Tickets
            'tickets.index' => 'Viewed tickets list',
            'tickets.show' => 'Viewed ticket details',
            'tickets.create' => 'Accessed create ticket',
            'tickets.edit' => 'Accessed edit ticket',
            'tickets.store' => 'Created new ticket',
            'tickets.update' => 'Updated ticket',
            'tickets.destroy' => 'Deleted ticket',
            'tickets.assignTechnical' => 'Assigned technical to ticket',
            'tickets.unassign' => 'Unassigned technical from ticket',
            'tickets.addHistory' => 'Added history to ticket',
            'tickets.addMemberFeedback' => 'Added member feedback to ticket',
            'tickets.updateStatus' => 'Updated ticket status',
            'tickets.uploadEvidence' => 'Uploaded evidence to ticket',
            'tickets.addPrivateNote' => 'Added private note to ticket',
            'tickets.sendMessageToTechnical' => 'Sent message to technical',
            'tickets.assign-unassigned' => 'Assigned unassigned tickets',
            'tickets.technicalsList' => 'Viewed technicals list',
            'tickets.quick-create' => 'Created quick ticket',
            'tickets.create-from-alert' => 'Created ticket from alert',
            'tickets.store-from-alert' => 'Stored ticket from alert',
            
            // Buildings
            'buildings.index' => 'Viewed buildings list',
            'buildings.show' => 'Viewed building details',
            'buildings.create' => 'Accessed create building',
            'buildings.edit' => 'Accessed edit building',
            'buildings.store' => 'Created new building',
            'buildings.update' => 'Updated building',
            'buildings.destroy' => 'Deleted building',
            'buildings.update-status' => 'Updated building status',
            'buildings.apartments' => 'Viewed building apartments',
            'buildings.apartments.store' => 'Added apartment to building',
            'buildings.apartments.bulk-upload' => 'Bulk uploaded apartments',
            'buildings.update-owner' => 'Updated building owner',
            'buildings.reset-passwords' => 'Reset building passwords',
            
            // Technicals
            'technicals.index' => 'Viewed technicals list',
            'technicals.show' => 'Viewed technical details',
            'technicals.create' => 'Accessed create technical',
            'technicals.edit' => 'Accessed edit technical',
            'technicals.store' => 'Created new technical',
            'technicals.update' => 'Updated technical',
            'technicals.destroy' => 'Deleted technical',
            'technicals.availability' => 'Viewed technical availability',
            'technicals.update-status' => 'Updated technical status',
            'technicals.set-default' => 'Set default technical',
            'technicals.reset-password' => 'Reset technical password',
            'technicals.send-instruction' => 'Sent instruction to technical',
            
            // Appointments
            'appointments.index' => 'Viewed appointments list',
            'appointments.show' => 'Viewed appointment details',
            'appointments.create' => 'Accessed create appointment',
            'appointments.edit' => 'Accessed edit appointment',
            'appointments.store' => 'Created new appointment',
            'appointments.update' => 'Updated appointment',
            'appointments.destroy' => 'Deleted appointment',
            'appointments.details' => 'Viewed appointment details',
            'appointments.start' => 'Started appointment',
            'appointments.complete' => 'Completed appointment',
            'appointments.member-feedback' => 'Added member feedback to appointment',
            'appointments.cancel' => 'Cancelled appointment',
            'appointments.reschedule' => 'Rescheduled appointment',
            'appointments.no-show' => 'Marked appointment as no-show',
            
            // Devices
            'devices.index' => 'Viewed devices list',
            'devices.show' => 'Viewed device details',
            'devices.create' => 'Accessed create device',
            'devices.edit' => 'Accessed edit device',
            'devices.store' => 'Created new device',
            'devices.update' => 'Updated device',
            'devices.destroy' => 'Deleted device',
            'devices.sync' => 'Synced device',
            'devices.alerts' => 'Viewed device alerts',
            
            // Customers
            'customers.index' => 'Viewed customers list',
            'customers.store' => 'Created new customer',
            'customers.update' => 'Updated customer',
            'customers.destroy' => 'Deleted customer',
            'customers.apartments' => 'Viewed customer apartments',
            
            // Apartments
            'apartments.update' => 'Updated apartment',
            'apartments.destroy' => 'Deleted apartment',
            'apartments.reset-passwords' => 'Reset apartment passwords',
            
            // Tenants
            'tenants.index' => 'Viewed tenants list',
            'tenants.show' => 'Viewed tenant details',
            'tenants.create' => 'Accessed create tenant',
            'tenants.edit' => 'Accessed edit tenant',
            'tenants.store' => 'Created new tenant',
            'tenants.update' => 'Updated tenant',
            'tenants.destroy' => 'Deleted tenant',
            'tenants.tickets' => 'Viewed tenant tickets',
            'tenants.reset-password' => 'Reset tenant password',
            'tenants.bulk-reset-passwords' => 'Bulk reset tenant passwords',
            
            // Supports
            'supports.index' => 'Viewed supports list',
            'supports.show' => 'Viewed support details',
            'supports.create' => 'Accessed create support',
            'supports.edit' => 'Accessed edit support',
            'supports.store' => 'Created new support',
            'supports.update' => 'Updated support',
            'supports.destroy' => 'Deleted support',
            
            // Audit Logs
            'audit-logs.index' => 'Viewed audit logs',
            'audit-logs.show' => 'Viewed audit log details',
            'audit-logs.api' => 'Accessed audit logs API',
            'audit-logs.export' => 'Exported audit logs',
            'audit-logs.stats' => 'Viewed audit logs statistics',
            'audit-logs.cleanup' => 'Cleaned up old audit logs',
            
            // Settings & Profile
            'settings.index' => 'Accessed settings',
            'settings.show' => 'Viewed settings',
            'profile.edit' => 'Accessed edit profile',
            'profile.update' => 'Updated profile',
            'profile.destroy' => 'Deleted profile',
            'password.edit' => 'Accessed change password',
            'password.update' => 'Updated password',
            'password.request' => 'Requested password reset',
            'password.email' => 'Sent password reset email',
            'password.reset' => 'Accessed password reset',
            'password.store' => 'Stored new password',
            'password.confirm' => 'Confirmed password',
            
            // Brand/Model/System Management
            'brands.update' => 'Updated brand',
            'models.update' => 'Updated model',
            'systems.update' => 'Updated system',
            'name_devices.update' => 'Updated device name',
            
            // Chief Tech Dashboard
            'assign-ticket' => 'Assigned ticket',
            'bulk-assign-tickets' => 'Bulk assigned tickets',
            'unassigned-tickets' => 'Viewed unassigned tickets',
            'available-technicians' => 'Viewed available technicians',
            'technician.status' => 'Updated technician status',
            'technician.instructions' => 'Sent technician instructions',
            'schedule-appointment' => 'Scheduled appointment',
            'team-analytics' => 'Viewed team analytics',
            
            // Doorman Dashboard
            'residents' => 'Viewed residents',
            'residents.search' => 'Searched residents',
            'notifications.resolved' => 'Viewed resolved notifications',
            'building.stats' => 'Viewed building statistics',
            
            // NinjaOne Integration
            'demo' => 'Accessed demo',
            'alerts' => 'Viewed alerts',
            'alerts.acknowledge' => 'Acknowledged alert',
            'alerts.resolve' => 'Resolved alert',
            'alerts.create-ticket' => 'Created ticket from alert',
            'acknowledge' => 'Acknowledged item',
            'create-ticket' => 'Created ticket',
        ];

        if ($routeName && isset($routeDescriptions[$routeName])) {
            return $routeDescriptions[$routeName];
        }

        // Generic description based on route
        $pathSegments = explode('/', trim($path, '/'));
        $resource = $pathSegments[0] ?? 'resource';
        
        $actionDescriptions = [
            'created' => "Created {$resource}",
            'updated' => "Updated {$resource}",
            'deleted' => "Deleted {$resource}",
            'viewed' => "Viewed {$resource}",
            'login' => 'Logged in',
            'logout' => 'Logged out',
        ];

        return $actionDescriptions[$actionType] ?? "Executed {$actionType} action on {$resource}";
    }

    /**
     * Verificar si la ruta debe ser auditada
     */
    protected function shouldAuditRoute(Request $request): bool
    {
        $path = $request->path();
        
        foreach ($this->excludedRoutes as $excludedRoute) {
            if (str_contains($excludedRoute, '*')) {
                // Escapar caracteres especiales de regex y reemplazar * con .*
                $pattern = preg_quote($excludedRoute, '/');
                $pattern = str_replace('\*', '.*', $pattern);
                if (preg_match("/^{$pattern}$/", $path)) {
                    return false;
                }
            } elseif ($path === $excludedRoute) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Verificar si el método HTTP debe ser auditado
     */
    protected function shouldAuditMethod(Request $request): bool
    {
        // Auditar todos los métodos que modifican datos
        if (in_array($request->method(), $this->auditedMethods)) {
            return true;
        }
        
        // También auditar GET para rutas importantes (navegación principal)
        $importantRoutes = [
            'login', 'logout', 'dashboard',
            'tickets.index', 'tickets.show', 'tickets.create', 'tickets.edit',
            'buildings.index', 'buildings.show', 'buildings.create', 'buildings.edit',
            'technicals.index', 'technicals.show', 'technicals.create', 'technicals.edit',
            'appointments.index', 'appointments.show', 'appointments.create', 'appointments.edit',
            'devices.index', 'devices.show', 'devices.create', 'devices.edit',
            'tenants.index', 'tenants.show', 'tenants.create', 'tenants.edit',
            'audit-logs.index', 'audit-logs.show',
            'settings.index', 'settings.show'
        ];
        $routeName = $request->route()?->getName();
        
        if ($request->method() === 'GET' && $routeName && in_array($routeName, $importantRoutes)) {
            return true;
        }
        
        return false;
    }

    /**
     * Verificar si la respuesta fue exitosa
     */
    protected function isSuccessfulResponse(Response $response): bool
    {
        return $response->getStatusCode() >= 200 && $response->getStatusCode() < 300;
    }

    /**
     * Filtrar datos sensibles de la petición
     */
    protected function filterSensitiveData(array $data): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'api_key',
            'secret',
            '_token',
            'csrf_token',
        ];
        
        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[FILTERED]';
            }
        }
        
        return $data;
    }
}
