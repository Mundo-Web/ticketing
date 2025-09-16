<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\NinjaOneAlert;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class NinjaOneAlertsController extends Controller
{
    /**
     * Get user's device alerts for notifications
     */
    public function userDeviceAlerts(Request $request)
    {
        $user = Auth::user();
        
        // Get user's devices (owned and shared)
        $userDeviceIds = collect();
        
        // Get tenant (either user is a tenant or has a tenant relationship)
        $tenant = $user->tenant ?? $user;
        
        // Get devices owned by this tenant/user
        if ($tenant && method_exists($tenant, 'devices')) {
            $ownedDevices = $tenant->devices()->get();
            $userDeviceIds = $userDeviceIds->merge($ownedDevices->pluck('id'));
        }
        
        Log::info('User device alerts request', [
            'user_id' => $user->id,
            'user_type' => get_class($user),
            'tenant_id' => $tenant ? $tenant->id : null,
            'device_ids' => $userDeviceIds->toArray()
        ]);
        
        // Get alerts for user's devices
        $alerts = NinjaOneAlert::with(['device'])
            ->whereIn('device_id', $userDeviceIds->unique())
            ->where('status', '!=', 'resolved') // Only show unresolved alerts
            ->orderBy('severity', 'desc') // Critical first
            ->orderBy('created_at', 'desc')
            ->limit(10) // Limit to recent alerts
            ->get();
        
        return response()->json([
            'success' => true,
            'device_alerts' => $alerts->map(function($alert) {
                return [
                    'id' => $alert->id,
                    'device_id' => $alert->device_id,
                    'device_name' => $alert->device->name ?? 'Unknown Device',
                    'title' => $alert->title,
                    'description' => $alert->description,
                    'severity' => $alert->severity,
                    'status' => $alert->status,
                    'alert_type' => $alert->alert_type,
                    'created_at' => $alert->created_at,
                    'health_status' => $alert->severity, // For compatibility with existing code
                    'issues_count' => 1
                ];
            })
        ]);
    }

    /**
     * Display user's device alerts
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is super admin (can see all alerts)
        $isSuperAdmin = $user->hasRole('super_admin') || 
                       $user->email === 'superadmin@adk.com' || 
                       $user->id === 1;
        
        Log::info('NinjaOne Alerts Index - User access check', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'is_super_admin' => $isSuperAdmin,
            'user_roles' => $user->roles ? $user->roles->pluck('name') : []
        ]);
        
        if ($isSuperAdmin) {
            // Super admin can see ALL alerts
            $alertsQuery = NinjaOneAlert::with(['device']);
            Log::info('Super admin viewing all alerts');
        } else {
            // Regular users - filter by their devices
            $userDeviceIds = collect();
            
            // Get tenant (either user is a tenant or has a tenant relationship)
            $tenant = $user->tenant ?? $user;
            
            // Get devices owned by this tenant/user
            if ($tenant && method_exists($tenant, 'devices')) {
                $ownedDevices = $tenant->devices()->get();
                $userDeviceIds = $userDeviceIds->merge($ownedDevices->pluck('id'));
            }
            
            Log::info('Regular user device access', [
                'tenant_id' => $tenant ? $tenant->id : null,
                'device_ids' => $userDeviceIds->toArray(),
                'total_devices' => $userDeviceIds->count()
            ]);
            
            // Filter alerts by user's devices ONLY
            $alertsQuery = NinjaOneAlert::with(['device'])
                ->whereIn('device_id', $userDeviceIds->unique()); // ONLY user's devices
        }
        
        // Apply search and filter conditions
        $alertsQuery = $alertsQuery
            ->when($request->search, function($query, $search) {
                return $query->where(function($q) use ($search) {
                    $q->where('title', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%")
                      ->orWhereHas('device', function($deviceQuery) use ($search) {
                          $deviceQuery->where('name', 'LIKE', "%{$search}%");
                      });
                });
            })
            ->when($request->severity, function($query, $severity) {
                return $query->where('severity', $severity);
            })
            ->when($request->status, function($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc');

        $alerts = $alertsQuery->paginate(15);

        // If request expects JSON (for API calls), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'alerts' => $alerts,
                'filters' => $request->only(['search', 'severity', 'status']),
            ]);
        }

        // Otherwise return Inertia response (for web interface)
        return Inertia::render('NinjaOneAlerts/Index', [
            'alerts' => $alerts,
            'filters' => $request->only(['search', 'severity', 'status']),
        ]);
    }

    /**
     * Show alert details
     */
    public function show(NinjaOneAlert $alert)
    {
        $alert->load(['device']);

        return Inertia::render('NinjaOneAlerts/Show', [
            'alert' => $alert
        ]);
    }

    /**
     * Acknowledge an alert
     */
    public function acknowledge(NinjaOneAlert $alert)
    {
        if ($alert->status === 'open') {
            $alert->update([
                'status' => 'acknowledged',
                'acknowledged_at' => now(),
            ]);
            return back()->with('success', 'Alert acknowledged successfully.');
        }

        return back()->with('error', 'Alert cannot be acknowledged.');
    }

    /**
     * Create ticket from alert
     */
    public function createTicket(Request $request, NinjaOneAlert $alert)
    {
        // Check if ticket already exists
        if ($alert->ticket_created) {
            return back()->with('error', 'A ticket already exists for this alert.');
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'required|in:low,normal,high,urgent'
        ]);

        // Create ticket
        $ticket = Ticket::create([
            'title' => $request->title ?: $alert->title,
            'description' => $request->description ?: $this->generateTicketDescription($alert),
            'category' => $this->mapSeverityToCategory($alert->severity),
            'status' => 'open',
            'user_id' => Auth::user()->id,
            'device_id' => $alert->device_id,
            'attachments' => json_encode([
                'ninjaone_alert_id' => $alert->id,
                'ninjaone_alert_data' => $alert->metadata,
                'created_via' => 'web_interface'
            ])
        ]);

        // Link alert to ticket
        $alert->update(['ticket_id' => $ticket->id]);

        return redirect()->route('tickets.show', $ticket)
            ->with('success', 'Ticket created successfully from NinjaOne alert.');
    }

    /**
     * Generate ticket description from alert
     */
    private function generateTicketDescription(NinjaOneAlert $alert): string
    {
        $deviceName = $alert->device->name_device->name ?? $alert->device->name ?? 'Unknown Device';
        
        $description = "**NinjaOne Alert Details**\n\n";
        $description .= "**Device:** {$deviceName}\n";
        $description .= "**Alert Type:** {$alert->alert_type}\n";
        $description .= "**Severity:** " . ucfirst($alert->severity) . "\n";
        
        // Handle null ninjaone_created_at
        if ($alert->ninjaone_created_at) {
            $description .= "**Created:** {$alert->ninjaone_created_at->format('Y-m-d H:i:s')}\n\n";
        } else {
            $description .= "**Created:** {$alert->created_at->format('Y-m-d H:i:s')}\n\n";
        }
        
        $description .= "**Description:**\n{$alert->description}\n\n";
        
        if ($alert->metadata) {
            $description .= "**Additional Details:**\n";
            foreach ($alert->metadata as $key => $value) {
                if (is_string($value) || is_numeric($value)) {
                    $description .= "- " . ucfirst(str_replace('_', ' ', $key)) . ": {$value}\n";
                }
            }
        }

        return $description;
    }

    /**
     * Map alert severity to ticket category
     */
    private function mapSeverityToCategory(string $severity): string
    {
        $mapping = [
            'critical' => 'Hardware',
            'warning' => 'System',
            'info' => 'Maintenance',
            'low' => 'General'
        ];

        return $mapping[$severity] ?? 'General';
    }

    /**
     * Get alerts count for notifications
     */
    public function getAlertsCount()
    {
        $user = Auth::user();
        
        $userDevices = Device::where('tenant_id', $user->id)
            ->orWhereHas('tenants', function($query) use ($user) {
                $query->where('tenant_id', $user->id);
            })
            ->pluck('id');

        $count = NinjaOneAlert::whereIn('device_id', $userDevices)
            ->where('status', 'open')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Get NinjaOne alerts for mobile app
     */
    public function mobileAlerts(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado',
                    'alerts' => []
                ], 401);
            }

            // Verificar rol de member para móvil
            if (!$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado. Solo para members.',
                    'alerts' => []
                ], 403);
            }

            // Obtener tenant del usuario
            $tenant = $user->tenant;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perfil de tenant no encontrado',
                    'alerts' => []
                ], 404);
            }

            // Obtener dispositivos del tenant
            $deviceIds = collect();
            if (method_exists($tenant, 'devices')) {
                $devices = $tenant->devices()->get();
                $deviceIds = $devices->pluck('id');
            }

            if ($deviceIds->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'alerts' => [],
                    'total_count' => 0,
                    'critical_count' => 0,
                    'warning_count' => 0
                ]);
            }

            // Obtener alertas activas de los dispositivos del usuario
            $alertsQuery = NinjaOneAlert::with(['device'])
                ->whereIn('device_id', $deviceIds)
                ->whereIn('status', ['open', 'acknowledged']) // Solo alertas activas
                ->orderBy('severity', 'desc') // Críticas primero
                ->orderBy('created_at', 'desc');

            // Aplicar filtros si se proporcionan
            if ($request->has('severity')) {
                $alertsQuery->where('severity', $request->severity);
            }

            if ($request->has('status')) {
                $alertsQuery->where('status', $request->status);
            }

            $alerts = $alertsQuery->limit(50)->get();

            // Transformar para móvil
            $transformedAlerts = $alerts->map(function($alert) {
                return [
                    'id' => $alert->id,
                    'title' => $alert->title,
                    'description' => $alert->description,
                    'severity' => $alert->severity,
                    'status' => $alert->status,
                    'alert_type' => $alert->alert_type,
                    'device' => [
                        'id' => $alert->device->id,
                        'name' => $alert->device->name,
                        'ninjaone_device_id' => $alert->device->ninjaone_device_id
                    ],
                    'created_at' => $alert->created_at->toISOString(),
                    'can_create_ticket' => !$alert->ticket_created,
                    'can_acknowledge' => $alert->status === 'open'
                ];
            });

            // Contar por severidad
            $criticalCount = $alerts->where('severity', 'critical')->count();
            $warningCount = $alerts->where('severity', 'warning')->count();

            Log::info('Mobile NinjaOne alerts fetched', [
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
                'device_count' => $deviceIds->count(),
                'alerts_count' => $alerts->count(),
                'critical_count' => $criticalCount,
                'warning_count' => $warningCount
            ]);

            return response()->json([
                'success' => true,
                'alerts' => $transformedAlerts,
                'total_count' => $alerts->count(),
                'critical_count' => $criticalCount,
                'warning_count' => $warningCount,
                'device_count' => $deviceIds->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching mobile NinjaOne alerts', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener alertas',
                'alerts' => []
            ], 500);
        }
    }

    /**
     * Acknowledge alert via mobile API
     */
    public function mobileAcknowledge(Request $request, NinjaOneAlert $alert)
    {
        try {
            $user = $request->user();
            
            if (!$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado'
                ], 403);
            }

            // Verificar que el dispositivo pertenece al tenant del usuario
            $tenant = $user->tenant;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perfil de tenant no encontrado'
                ], 404);
            }

            $deviceIds = collect();
            if (method_exists($tenant, 'devices')) {
                $devices = $tenant->devices()->get();
                $deviceIds = $devices->pluck('id');
            }

            if (!$deviceIds->contains($alert->device_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para esta alerta'
                ], 403);
            }

            if ($alert->status === 'open') {
                $alert->update([
                    'status' => 'acknowledged',
                    'acknowledged_at' => now(),
                ]);

                Log::info('Mobile alert acknowledged', [
                    'alert_id' => $alert->id,
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Alerta confirmada exitosamente'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Esta alerta no puede ser confirmada'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Error acknowledging mobile alert', [
                'alert_id' => $alert->id,
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar alerta'
            ], 500);
        }
    }

    /**
     * Create ticket from alert via mobile API
     */
    public function mobileCreateTicket(Request $request, NinjaOneAlert $alert)
    {
        try {
            $user = $request->user();
            
            if (!$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Acceso denegado'
                ], 403);
            }

            // Verificar que el dispositivo pertenece al tenant del usuario
            $tenant = $user->tenant;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Perfil de tenant no encontrado'
                ], 404);
            }

            $deviceIds = collect();
            if (method_exists($tenant, 'devices')) {
                $devices = $tenant->devices()->get();
                $deviceIds = $devices->pluck('id');
            }

            if (!$deviceIds->contains($alert->device_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para esta alerta'
                ], 403);
            }

            // Check if ticket already exists
            if ($alert->ticket_created) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un ticket para esta alerta'
                ], 400);
            }

            $request->validate([
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'nullable|in:low,normal,high,urgent'
            ]);

        // Create ticket
        $ticket = Ticket::create([
            'title' => $request->title ?: $alert->title,
            'description' => $request->description ?: $this->generateTicketDescription($alert),
            'category' => $this->mapSeverityToCategory($alert->severity),
            'status' => 'open',
            'user_id' => $user->id,
            'device_id' => $alert->device_id,
            'attachments' => json_encode([
                'ninjaone_alert_id' => $alert->id,
                'ninjaone_alert_data' => $alert->metadata,
                'created_via' => 'mobile_app'
            ])
        ]);            // Link alert to ticket
            $alert->update(['ticket_id' => $ticket->id]);

            Log::info('Mobile ticket created from alert', [
                'alert_id' => $alert->id,
                'ticket_id' => $ticket->id,
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Ticket creado exitosamente',
                'ticket_id' => $ticket->id,
                'ticket' => [
                    'id' => $ticket->id,
                    'title' => $ticket->title,
                    'priority' => $ticket->priority,
                    'status' => $ticket->status
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating mobile ticket from alert', [
                'alert_id' => $alert->id,
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear ticket'
            ], 500);
        }
    }
}
