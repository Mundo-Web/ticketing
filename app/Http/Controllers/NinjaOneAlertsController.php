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
            'priority' => $request->priority,
            'status' => 'open',
            'tenant_id' => Auth::user()->id,
            'device_id' => $alert->device_id,
            'source' => 'ninjaone_alert',
            'metadata' => [
                'ninjaone_alert_id' => $alert->id,
                'ninjaone_alert_data' => $alert->metadata
            ]
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
        $description .= "**Created:** {$alert->ninjaone_created_at->format('Y-m-d H:i:s')}\n\n";
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
}
