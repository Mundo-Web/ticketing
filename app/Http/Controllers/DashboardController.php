<?php

namespace App\Http\Controllers;

use App\Models\Apartment;
use App\Models\Building;
use App\Models\Device;
use App\Models\Support;
use App\Models\Technical;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Check user role to filter data
        $isSuperAdmin = $user->hasRole('super-admin');
        
        // Check if user can assign tickets (super-admin or default technical)
        $isDefaultTechnical = false;
        if ($user->hasRole('technical')) {
            $technical = Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        $canAssignTickets = $isSuperAdmin || $isDefaultTechnical;
        
        // Base query para tickets según rol
        $ticketsQuery = Ticket::query();
        if (!$isSuperAdmin) {
            // Si no es super-admin, solo ve sus propios tickets o los de su edificio
            if ($user->hasRole('tenant')) {
                $ticketsQuery->where('user_id', $user->id);
            } elseif ($user->hasRole('technical')) {
                $technical = Technical::where('user_id', $user->id)->first();
                if ($technical) {
                    $ticketsQuery->where('technical_id', $technical->id);
                }
            }
        }
        
        // Métricas principales de tickets
        $totalTickets = $ticketsQuery->count();
        $openTickets = (clone $ticketsQuery)->where('status', 'open')->count();
        $inProgressTickets = (clone $ticketsQuery)->where('status', 'in_progress')->count();
        $resolvedTickets = (clone $ticketsQuery)->where('status', 'resolved')->count();
        $unassignedTickets = (clone $ticketsQuery)->whereNull('technical_id')->count();
        
        // Métricas de recursos (solo super-admin ve todo)
        if ($isSuperAdmin) {
            $totalBuildings = Building::count();
            $totalApartments = Apartment::count();
            $totalTenants = Tenant::count();
            $totalDevices = Device::count();
            $totalTechnicals = Technical::where('status', true)->count();
        } else {
            // Para otros roles, métricas limitadas
            $totalBuildings = 0;
            $totalApartments = 0;
            $totalTenants = 0;
            $totalDevices = 0;
            $totalTechnicals = 0;
        }
        
        // Tickets por estado (para gráfico de dona)
        $ticketsByStatus = (clone $ticketsQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');
            
        // Tickets creados en los últimos 7 días
        $ticketsLastWeek = (clone $ticketsQuery)
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
            
        // Técnicos más activos (con más tickets asignados) - solo para super-admin
        if ($isSuperAdmin) {
            $topTechnicals = Technical::leftJoin('tickets', 'technicals.id', '=', 'tickets.technical_id')
                ->select('technicals.name', 'technicals.photo', DB::raw('count(tickets.id) as tickets_count'))
                ->groupBy('technicals.id', 'technicals.name', 'technicals.photo')
                ->orderByDesc('tickets_count')
                ->limit(5)
                ->get();
        } else {
            $topTechnicals = collect();
        }
            
        // Edificios con más tickets - simplificar por ahora
        if ($isSuperAdmin) {
            $buildingsWithTickets = Building::select('buildings.name', 'buildings.image', DB::raw('0 as tickets_count'))
                ->limit(5)
                ->get();
        } else {
            $buildingsWithTickets = collect();
        }
            
        // Tickets recientes
        $recentTickets = (clone $ticketsQuery)
            ->with(['user', 'device', 'technical'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();
            
        // Dispositivos por tipo - solo para super-admin
        if ($isSuperAdmin) {
            $devicesByType = Device::join('name_devices', 'devices.name_device_id', '=', 'name_devices.id')
                ->select('name_devices.name', DB::raw('count(*) as count'))
                ->groupBy('name_devices.id', 'name_devices.name')
                ->get();
        } else {
            $devicesByType = collect();
        }
            
        // Tickets por prioridad - remover ya que no existe la columna
        $ticketsByPriority = collect(); // Colección vacía por ahora
            
        // Tickets resueltos hoy
        $ticketsResolvedToday = (clone $ticketsQuery)
            ->where('status', 'resolved')
            ->whereDate('resolved_at', Carbon::today())
            ->count();
            
        // Promedio de tiempo de resolución (en horas)
        $avgResolutionTime = (clone $ticketsQuery)
            ->where('status', 'resolved')
            ->whereNotNull('resolved_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours'))
            ->first();
            
        // Tickets por categoría
        $ticketsByCategory = (clone $ticketsQuery)
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->get()
            ->pluck('count', 'category');
            
        // Dispositivos más problemáticos - solo para super-admin
        if ($isSuperAdmin) {
            $problematicDevices = Device::leftJoin('tickets', 'devices.id', '=', 'tickets.device_id')
                ->leftJoin('name_devices', 'devices.name_device_id', '=', 'name_devices.id')
                ->select(
                    'name_devices.name as device_type',
                    'devices.name as device_name',
                    DB::raw('count(tickets.id) as tickets_count')
                )
                ->groupBy('devices.id', 'name_devices.name', 'devices.name')
                ->orderByDesc('tickets_count')
                ->limit(5)
                ->get();
        } else {
            $problematicDevices = collect();
        }

        // Lista de técnicos disponibles para asignación (solo si puede asignar)
        $availableTechnicals = collect();
        if ($canAssignTickets) {
            $availableTechnicals = Technical::where('status', true)
                ->select('id', 'name', 'is_default')
                ->orderBy('is_default', 'desc') // Técnicos por defecto primero
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('dashboard', [
            'metrics' => [
                'tickets' => [
                    'total' => $totalTickets,
                    'open' => $openTickets,
                    'in_progress' => $inProgressTickets,
                    'resolved' => $resolvedTickets,
                    'resolved_today' => $ticketsResolvedToday,
                    'avg_resolution_hours' => $avgResolutionTime ? round($avgResolutionTime->avg_hours, 1) : 0,
                    'unassigned' => $unassignedTickets,
                ],
                'resources' => [
                    'buildings' => $totalBuildings,
                    'apartments' => $totalApartments,
                    'tenants' => $totalTenants,
                    'devices' => $totalDevices,
                    'technicals' => $totalTechnicals,
                ]
            ],
            'charts' => [
                'ticketsByStatus' => $ticketsByStatus,
                'ticketsLastWeek' => $ticketsLastWeek,
                'devicesByType' => $devicesByType,
                'ticketsByPriority' => $ticketsByPriority,
                'ticketsByCategory' => $ticketsByCategory,
            ],
            'lists' => [
                'topTechnicals' => $topTechnicals,
                'buildingsWithTickets' => $buildingsWithTickets,
                'recentTickets' => $recentTickets,
                'problematicDevices' => $problematicDevices,
                'unassignedTickets' => $canAssignTickets ? Ticket::with([
                        'user.tenant.apartment.building', 
                        'device' => function($query) {
                            $query->with(['name_device', 'tenants.apartment.building']);
                        }
                    ])
                    ->whereNull('technical_id')
                    ->where('status', '!=', 'closed')
                    ->where('status', '!=', 'cancelled')
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get() : collect(),
                'availableTechnicals' => $availableTechnicals,
            ]
        ]);
    }
}
