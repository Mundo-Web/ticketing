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
                $technical = Technical::where('email', $user->email)->first();
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

        // Técnicos más activos con información detallada
        if ($isSuperAdmin) {
            $topTechnicals = Technical::leftJoin('tickets', 'technicals.id', '=', 'tickets.technical_id')
                ->select(
                    'technicals.id',
                    'technicals.name',
                    'technicals.photo',
                    'technicals.email',
                    'technicals.phone',
                    'technicals.shift',
                    'technicals.is_default',
                    DB::raw('count(tickets.id) as tickets_count')
                )
                ->where('technicals.status', true)
                ->groupBy('technicals.id', 'technicals.name', 'technicals.photo', 'technicals.email', 'technicals.phone', 'technicals.shift', 'technicals.is_default')
                ->orderByDesc('tickets_count')
                ->get();
        } else {
            $topTechnicals = collect();
        }

        // Edificios con información detallada
        if ($isSuperAdmin) {
            $buildingsWithTickets = Building::leftJoin('apartments', 'buildings.id', '=', 'apartments.buildings_id')
                ->leftJoin('tenants', 'apartments.id', '=', 'tenants.apartment_id')
                ->leftJoin('users', 'tenants.email', '=', 'users.email')
                ->leftJoin('tickets', 'users.id', '=', 'tickets.user_id')
                ->select(
                    'buildings.id',
                    'buildings.name',
                    'buildings.image',
                    DB::raw('COUNT(DISTINCT apartments.id) as apartments_count'),
                    DB::raw('COUNT(DISTINCT tenants.id) as tenants_count'),
                    DB::raw('COUNT(tickets.id) as tickets_count')
                )
                ->groupBy('buildings.id', 'buildings.name', 'buildings.image')
                ->orderBy('buildings.name')
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

        // Dispositivos por tipo con información detallada
        if ($isSuperAdmin) {
            $devicesByType = Device::with(['model', 'brand', 'system', 'name_device', 'tenants.apartment.building'])
                ->join('name_devices', 'devices.name_device_id', '=', 'name_devices.id')
                ->join('models', 'devices.model_id', '=', 'models.id')
                ->join('brands', 'devices.brand_id', '=', 'brands.id')
                ->join('systems', 'devices.system_id', '=', 'systems.id')
                ->leftJoin('device_tenant', 'devices.id', '=', 'device_tenant.device_id')
                ->select(
                    'devices.id',
                    'devices.name as device_name',
                    'name_devices.name as device_type',
                    'models.name as model_name',
                    'brands.name as brand_name',
                    'systems.name as system_name',
                    DB::raw('COUNT(DISTINCT device_tenant.tenant_id) as users_count')
                )
                ->groupBy('devices.id', 'devices.name', 'name_devices.name', 'models.name', 'brands.name', 'systems.name')
                ->get();

            // Agrupar por tipo de dispositivo para el gráfico
            $deviceTypesSummary = $devicesByType->groupBy('device_type')->map(function ($devices, $type) {
                return [
                    'name' => $type,
                    'count' => $devices->count(),
                    'devices' => $devices
                ];
            })->values();
        } else {
            $devicesByType = collect();
            $deviceTypesSummary = collect();
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
                'devicesByType' => $deviceTypesSummary,
                'ticketsByPriority' => $ticketsByPriority,
                'ticketsByCategory' => $ticketsByCategory,
            ],
            'lists' => [
                'topTechnicals' => $topTechnicals,
                'buildingsWithTickets' => $buildingsWithTickets,
                'recentTickets' => $recentTickets,
                'problematicDevices' => $problematicDevices,
                'allDevices' => $devicesByType,
                'unassignedTickets' => $canAssignTickets ? Ticket::with([
                    'user' => function ($query) {
                        $query->with(['tenant' => function ($tenantQuery) {
                            $tenantQuery->with(['apartment' => function ($apartmentQuery) {
                                $apartmentQuery->with('building');
                            }]);
                        }]);
                    },
                    'device' => function ($query) {
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
