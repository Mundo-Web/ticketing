<?php

namespace App\Http\Controllers;

use App\Models\Doorman;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\Apartment;
use App\Models\Device;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DoormanController extends Controller
{
    /**
     * Display doorman dashboard with building-specific data
     */
    public function dashboard()
    {
        $user = Auth::user();
        
        if (!$user->hasRole('doorman')) {
            abort(403, 'Access denied. Doorman role required.');
        }

        $doorman = Doorman::where('email', $user->email)->with('building')->first();
        
        if (!$doorman || !$doorman->building) {
            abort(404, 'Doorman profile or building not found.');
        }

        $building = $doorman->building;
        $buildingId = $building->id;

        // Get tickets from doorman's building
        $ticketsQuery = Ticket::whereHas('user.tenant.apartment', function($query) use ($buildingId) {
            $query->where('buildings_id', $buildingId);
        });

        // Dashboard metrics
        $metrics = [
            'tickets_today' => (clone $ticketsQuery)->whereDate('created_at', Carbon::today())->count(),
            'tickets_open' => (clone $ticketsQuery)->where('status', 'open')->count(),
            'tickets_in_progress' => (clone $ticketsQuery)->where('status', 'in_progress')->count(),
            'tickets_resolved_today' => (clone $ticketsQuery)
                ->where('status', 'resolved')
                ->whereDate('resolved_at', Carbon::today())
                ->count(),
        ];

        // Tickets by apartment/floor
        $ticketsByApartment = (clone $ticketsQuery)
            ->join('users', 'tickets.user_id', '=', 'users.id')
            ->join('tenants', 'users.email', '=', 'tenants.email')
            ->join('apartments', 'tenants.apartment_id', '=', 'apartments.id')
            ->select(
                'apartments.id',
                'apartments.name as apartment_name',
                'apartments.ubicacion as floor',
                DB::raw('COUNT(*) as total_tickets'),
                DB::raw('COUNT(CASE WHEN tickets.status = "open" THEN 1 END) as open_tickets'),
                DB::raw('COUNT(CASE WHEN tickets.status = "in_progress" THEN 1 END) as in_progress_tickets'),
                DB::raw('COUNT(CASE WHEN tickets.status = "resolved" THEN 1 END) as resolved_tickets')
            )
            ->groupBy('apartments.id', 'apartments.name', 'apartments.ubicacion')
            ->orderBy('total_tickets', 'desc')
            ->get();

        // Recent tickets
        $recentTickets = (clone $ticketsQuery)
            ->with(['user.tenant', 'device.name_device', 'technical'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Tickets by status for chart
        $ticketsByStatus = (clone $ticketsQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        return Inertia::render('Doorman/Dashboard', [
            'doorman' => $doorman,
            'building' => $building,
            'metrics' => $metrics,
            'ticketsByApartment' => $ticketsByApartment,
            'recentTickets' => $recentTickets,
            'ticketsByStatus' => $ticketsByStatus,
        ]);
    }

    /**
     * Get residents of doorman's building for quick ticket creation
     */
    public function getResidents()
    {
        $user = Auth::user();
        
        if (!$user->hasRole('doorman')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $doorman = Doorman::where('email', $user->email)->first();
        
        if (!$doorman) {
            return response()->json(['error' => 'Doorman profile not found'], 404);
        }

        $residents = Tenant::whereHas('apartment', function($query) use ($doorman) {
            $query->where('buildings_id', $doorman->building_id);
        })
        ->with(['apartment', 'devices.name_device'])
        ->select('id', 'name', 'email', 'phone', 'apartment_id')
        ->orderBy('name')
        ->get();

        return response()->json(['residents' => $residents]);
    }

    /**
     * Search residents by name or apartment
     */
    public function searchResidents(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasRole('doorman')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $doorman = Doorman::where('email', $user->email)->first();
        
        if (!$doorman) {
            return response()->json(['error' => 'Doorman profile not found'], 404);
        }

        $search = $request->get('search', '');

        $residents = Tenant::whereHas('apartment', function($query) use ($doorman) {
            $query->where('buildings_id', $doorman->building_id);
        })
        ->where(function($query) use ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhereHas('apartment', function($apartmentQuery) use ($search) {
                      $apartmentQuery->where('name', 'like', "%{$search}%");
                  });
        })
        ->with(['apartment', 'devices.name_device'])
        ->select('id', 'name', 'email', 'phone', 'apartment_id')
        ->orderBy('name')
        ->limit(10)
        ->get();

        return response()->json(['residents' => $residents]);
    }

    /**
     * Quick ticket creation for doorman
     */
    public function createQuickTicket(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasRole('doorman')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $doorman = Doorman::where('email', $user->email)->first();
        
        if (!$doorman) {
            return response()->json(['error' => 'Doorman profile not found'], 404);
        }

        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'device_id' => 'required|exists:devices,id',
            'category' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|string|in:low,medium,high,urgent',
        ]);

        // Verify tenant belongs to doorman's building
        $tenant = Tenant::whereHas('apartment', function($query) use ($doorman) {
            $query->where('buildings_id', $doorman->building_id);
        })->findOrFail($validated['tenant_id']);

        // Verify device belongs to tenant
        $device = Device::whereHas('tenants', function($query) use ($tenant) {
            $query->where('tenants.id', $tenant->id);
        })->findOrFail($validated['device_id']);

        // Get tenant's user account
        $tenantUser = User::where('email', $tenant->email)->first();
        
        if (!$tenantUser) {
            return response()->json(['error' => 'Tenant user account not found'], 404);
        }

        // Create ticket
        $ticket = Ticket::create([
            'user_id' => $tenantUser->id,
            'device_id' => $device->id,
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => 'open',
            'created_by_doorman_id' => $doorman->id,
        ]);

        // Add history entry
        $ticket->addHistory(
            'created',
            "Ticket created by doorman {$doorman->name} on behalf of {$tenant->name}",
            null,
            null
        );

        return response()->json([
            'success' => true,
            'ticket' => $ticket->load(['user.tenant', 'device.name_device']),
            'message' => 'Ticket created successfully'
        ]);
    }

    /**
     * Get notifications for resolved tickets in doorman's building
     */
    public function getResolvedTicketNotifications()
    {
        $user = Auth::user();
        
        if (!$user->hasRole('doorman')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $doorman = Doorman::where('email', $user->email)->first();
        
        if (!$doorman) {
            return response()->json(['error' => 'Doorman profile not found'], 404);
        }

        // Get recently resolved tickets (last 7 days)
        $resolvedTickets = Ticket::whereHas('user.tenant.apartment', function($query) use ($doorman) {
            $query->where('buildings_id', $doorman->building_id);
        })
        ->where('status', 'resolved')
        ->where('resolved_at', '>=', Carbon::now()->subDays(7))
        ->with(['user.tenant.apartment', 'device.name_device', 'technical'])
        ->orderBy('resolved_at', 'desc')
        ->get();

        return response()->json(['resolved_tickets' => $resolvedTickets]);
    }

    /**
     * Get building statistics for doorman
     */
    public function getBuildingStats()
    {
        $user = Auth::user();
        
        if (!$user->hasRole('doorman')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $doorman = Doorman::where('email', $user->email)->first();
        
        if (!$doorman) {
            return response()->json(['error' => 'Doorman profile not found'], 404);
        }

        $buildingId = $doorman->building_id;

        $stats = [
            'total_apartments' => Apartment::where('buildings_id', $buildingId)->count(),
            'total_residents' => Tenant::whereHas('apartment', function($query) use ($buildingId) {
                $query->where('buildings_id', $buildingId);
            })->count(),
            'total_devices' => Device::whereHas('tenants.apartment', function($query) use ($buildingId) {
                $query->where('buildings_id', $buildingId);
            })->count(),
            'tickets_this_month' => Ticket::whereHas('user.tenant.apartment', function($query) use ($buildingId) {
                $query->where('buildings_id', $buildingId);
            })->whereMonth('created_at', Carbon::now()->month)->count(),
            'tickets_resolved_this_month' => Ticket::whereHas('user.tenant.apartment', function($query) use ($buildingId) {
                $query->where('buildings_id', $buildingId);
            })
            ->where('status', 'resolved')
            ->whereMonth('resolved_at', Carbon::now()->month)
            ->count(),
        ];

        return response()->json(['stats' => $stats]);
    }
}
