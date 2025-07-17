<?php

namespace App\Http\Controllers;

use App\Models\NinjaOneAlert;
use App\Models\Device;
use App\Models\Ticket;
use App\Services\NinjaOneService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class NinjaOneController extends Controller
{
    use AuthorizesRequests;
    protected $ninjaOneService;
    protected $notificationService;

    public function __construct(NinjaOneService $ninjaOneService, NotificationService $notificationService)
    {
        $this->ninjaOneService = $ninjaOneService;
        $this->notificationService = $notificationService;
    }

    /**
     * Get device alerts for a specific device (API endpoint)
     */
    public function getDeviceAlertsApi(Request $request, $deviceId)
    {
        try {
            $device = Device::findOrFail($deviceId);
            
            // Verificar que el usuario tiene acceso al dispositivo
            $user = $request->user();
            $hasAccess = false;
            
            // Verificar si es propietario del dispositivo usando las relaciones pivot
            if ($device->owner()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
                $hasAccess = true;
            }
            
            // Verificar si el dispositivo está compartido con el usuario
            if ($device->sharedWith()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
                $hasAccess = true;
            }
            
            // Verificar si es admin o técnico
            if ($user->hasRole(['super-admin', 'technical'])) {
                $hasAccess = true;
            }
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            // Si el dispositivo no está en NinjaOne, retornar vacío
            if (!$device->ninjaone_enabled || !$device->name) {
                return response()->json(['alerts' => []]);
            }
            
            // Obtener alertas desde NinjaOne
            $ninjaOneDeviceId = $this->ninjaOneService->findDeviceIdByName($device->name);
            if (!$ninjaOneDeviceId) {
                return response()->json(['alerts' => []]);
            }
            
            $alerts = $this->ninjaOneService->getDeviceAlerts($ninjaOneDeviceId);
            
            return response()->json([
                'alerts' => $alerts,
                'device' => $device,
                'ninjaone_device_id' => $ninjaOneDeviceId
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting device alerts', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
            
            return response()->json(['error' => 'Error fetching alerts'], 500);
        }
    }
    
    /**
     * Get all device alerts for the current user
     */
    public function getUserDeviceAlerts(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user->tenant) {
                return response()->json(['device_alerts' => []]);
            }
            
            // Obtener dispositivos del usuario a través de las relaciones pivot
            // Buscar dispositivos donde el usuario es owner o tiene acceso compartido
            $devices = Device::where('ninjaone_enabled', true)
                ->whereNotNull('name')
                ->where(function ($query) use ($user) {
                    $query->whereHas('owner', function ($q) use ($user) {
                        $q->where('tenants.id', $user->tenant->id);
                    })
                    ->orWhereHas('sharedWith', function ($q) use ($user) {
                        $q->where('tenants.id', $user->tenant->id);
                    });
                })
                ->get();
            
            $deviceAlerts = [];
            
            foreach ($devices as $device) {
                // Obtener información de salud del dispositivo
                $healthInfo = null;
                if ($device->ninjaone_device_id) {
                    $healthInfo = $this->ninjaOneService->getDeviceHealthStatus($device->ninjaone_device_id);
                } elseif ($device->name) {
                    $ninjaOneDeviceId = $this->ninjaOneService->findDeviceIdByName($device->name);
                    if ($ninjaOneDeviceId) {
                        $healthInfo = $this->ninjaOneService->getDeviceHealthStatus($ninjaOneDeviceId);
                    }
                }
                
                // Si hay problemas de salud, agregarlo a las alertas
                if ($healthInfo && ($healthInfo['status'] !== 'healthy' && $healthInfo['status'] !== 'online')) {
                    $deviceAlerts[] = [
                        'device_id' => $device->id,
                        'device_name' => $device->name_device->name ?? $device->name,
                        'device_icon' => $device->icon_id,
                        'health_status' => $healthInfo['status'],
                        'issues_count' => $healthInfo['issuesCount'] ?? 0,
                        'critical_count' => $healthInfo['criticalCount'] ?? 0,
                        'warning_count' => $healthInfo['warningCount'] ?? 0,
                        'is_offline' => $healthInfo['isOffline'] ?? ($healthInfo['status'] === 'offline'),
                        'last_contact' => $healthInfo['lastContact'] ?? null,
                        'alerts' => $healthInfo['alerts'] ?? []
                    ];
                }
            }
            
            return response()->json([
                'device_alerts' => $deviceAlerts,
                'total_devices' => $devices->count(),
                'devices_with_issues' => count($deviceAlerts)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error getting user device alerts', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage()
            ]);
            
            return response()->json(['error' => 'Error fetching device alerts'], 500);
        }
    }
    
    /**
     * Create a ticket from a device alert
     */
    public function createTicketFromDeviceAlert(Request $request)
    {
        try {
            $request->validate([
                'device_id' => 'required|exists:devices,id',
                'alert_type' => 'required|string',
                'alert_message' => 'required|string',
                'severity' => 'required|string'
            ]);
            
            $user = $request->user();
            $device = Device::findOrFail($request->device_id);
            
            // Verificar acceso al dispositivo
            $hasAccess = false;
            if ($device->owner()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
                $hasAccess = true;
            }
            
            if ($device->sharedWith()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
                $hasAccess = true;
            }
            
            if (!$hasAccess) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            // Crear el ticket
            $ticket = Ticket::create([
                'device_id' => $device->id,
                'user_id' => $user->id,
                'category' => $this->mapAlertTypeToCategory($request->alert_type),
                'title' => "NinjaOne Alert: " . $request->alert_type,
                'description' => $request->alert_message,
                'status' => 'open',
                'priority' => $this->mapSeverityToPriority($request->severity),
                'source' => 'ninjaone_alert'
            ]);
            
            return response()->json([
                'success' => true,
                'ticket' => $ticket,
                'message' => 'Ticket created successfully from NinjaOne alert'
            ]);
            
        } catch (Exception $e) {
            Log::error('Error creating ticket from alert', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);
            
            return response()->json(['error' => 'Error creating ticket'], 500);
        }
    }
    
    private function mapAlertTypeToCategory($alertType)
    {
        $categoryMap = [
            'AGENT_OFFLINE' => 'Red',
            'DISK_SPACE' => 'Hardware',
            'MEMORY_USAGE' => 'Hardware',
            'CPU_USAGE' => 'Hardware',
            'SERVICE_FAILURE' => 'Software',
            'ANTIVIRUS' => 'Software',
            'BACKUP' => 'Software',
            'PATCH_MANAGEMENT' => 'Software',
        ];
        
        return $categoryMap[$alertType] ?? 'Soporte';
    }
    
    private function mapSeverityToPriority($severity)
    {
        $priorityMap = [
            'CRITICAL' => 'high',
            'HIGH' => 'high',
            'MEDIUM' => 'medium',
            'LOW' => 'low',
            'INFO' => 'low'
        ];
        
        return $priorityMap[$severity] ?? 'medium';
    }
    public function createTicketFromAlert(NinjaOneAlert $alert)
    {
        // Simple authorization check - ensure user has access to the device
        $user = Auth::user();
        
        // Check if ticket already exists for this alert
        if ($alert->ticket_id) {
            return redirect()->route('tickets.show', $alert->ticket_id)
                ->with('info', 'A ticket already exists for this alert.');
        }

        // Pre-populate ticket data from alert
        $ticketData = [
            'device_id' => $alert->device_id,
            'title' => "NinjaOne Alert: {$alert->title}",
            'description' => $this->buildTicketDescription($alert),
            'category' => $this->ninjaOneService->mapAlertTypeToCategory($alert->alert_type),
            'ninjaone_alert_id' => $alert->id,
        ];

        return Inertia::render('Tickets/CreateFromAlert', [
            'alert' => $alert->load('device'),
            'ticketData' => $ticketData,
            'categories' => $this->getTicketCategories(),
        ]);
    }

    /**
     * Create ticket from NinjaOne alert
     */
    public function storeTicketFromAlert(Request $request, NinjaOneAlert $alert)
    {
        // Check if ticket already exists
        if ($alert->ticket_id) {
            return redirect()->route('tickets.show', $alert->ticket_id)
                ->with('info', 'A ticket already exists for this alert.');
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
        ]);

        $ticket = $this->notificationService->createTicketFromAlert($alert, Auth::user());

        if ($ticket) {
            // Update ticket with user input
            $ticket->update([
                'title' => $request->title,
                'description' => $request->description,
                'category' => $request->category,
            ]);

            return redirect()->route('tickets.show', $ticket->id)
                ->with('success', 'Ticket created successfully from NinjaOne alert.');
        }

        return back()->with('error', 'Failed to create ticket from alert.');
    }

    /**
     * Show NinjaOne alerts for user's devices
     */
    public function alerts(Request $request): Response
    {
        $user = Auth::user();
        
        // Get user's devices with NinjaOne integration
        $deviceIds = $user->tenant->devices()
            ->where('ninjaone_enabled', true)
            ->pluck('id');

        $alerts = NinjaOneAlert::whereIn('device_id', $deviceIds)
            ->with('device')
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when($request->severity, function ($query, $severity) {
                return $query->where('severity', $severity);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('NinjaOne/Alerts', [
            'alerts' => $alerts,
            'filters' => $request->only(['status', 'severity']),
            'stats' => [
                'total' => NinjaOneAlert::whereIn('device_id', $deviceIds)->count(),
                'open' => NinjaOneAlert::whereIn('device_id', $deviceIds)->where('status', 'open')->count(),
                'critical' => NinjaOneAlert::whereIn('device_id', $deviceIds)->where('severity', 'critical')->count(),
            ]
        ]);
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledgeAlert(NinjaOneAlert $alert)
    {
        $alert->acknowledge();

        return response()->json(['message' => 'Alert acknowledged successfully']);
    }

    /**
     * Resolve an alert
     */
    public function resolveAlert(NinjaOneAlert $alert)
    {
        $alert->resolve();

        return response()->json(['message' => 'Alert resolved successfully']);
    }

    /**
     * Sync device with NinjaOne
     */
    public function syncDevice(Device $device)
    {
        if (!$device->ninjaone_enabled) {
            return response()->json(['error' => 'NinjaOne integration not enabled for this device'], 400);
        }

        $success = $this->ninjaOneService->syncDevice($device);

        if ($success) {
            return response()->json(['message' => 'Device synced successfully']);
        }

        return response()->json(['error' => 'Failed to sync device'], 500);
    }

    /**
     * Get device alerts from NinjaOne API
     */
    public function getDeviceAlerts(Device $device)
    {
        if (!$device->ninjaone_enabled || !$device->ninjaone_device_id) {
            return response()->json(['error' => 'NinjaOne integration not configured'], 400);
        }

        $alerts = $this->ninjaOneService->getDeviceAlerts($device->ninjaone_device_id);

        return response()->json(['alerts' => $alerts]);
    }

    /**
     * Build ticket description from alert
     */
    protected function buildTicketDescription(NinjaOneAlert $alert): string
    {
        $description = "**Issue detected by NinjaOne monitoring:**\n\n";
        $description .= "**Alert:** {$alert->title}\n";
        $description .= "**Severity:** " . ucfirst($alert->severity) . "\n";
        $description .= "**Type:** {$alert->alert_type}\n";
        $description .= "**Detected:** {$alert->ninjaone_created_at->format('M j, Y \a\t g:i A')}\n\n";
        $description .= "**Description:**\n{$alert->description}\n\n";
        $description .= "**Additional details about the issue:**\n";
        $description .= "(Please describe any symptoms or problems you've noticed with this device)";

        return $description;
    }

    /**
     * Get available ticket categories
     */
    protected function getTicketCategories(): array
    {
        return [
            'Hardware',
            'Software', 
            'Network',
            'Security',
            'Performance',
            'General'
        ];
    }
}
