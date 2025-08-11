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
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        $isOwner = $user->hasRole('owner');
        $isDoorman = $user->hasRole('doorman');

        // Get building ID for owner/doorman filtering
        $buildingId = null;
        if ($isOwner) {
            $owner = $user->owner;
            $buildingId = $owner && $owner->building ? $owner->building->id : null;
        } elseif ($isDoorman) {
            $doorman = $user->doorman;
            $buildingId = $doorman && $doorman->building ? $doorman->building->id : null;
        }

        // Check if user can assign tickets (super-admin or default technical)
        $isDefaultTechnical = false;
        $currentTechnical = null;
        if ($user->hasRole('technical')) {
            $currentTechnical = Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $currentTechnical && $currentTechnical->is_default;
        }
        $canAssignTickets = $isSuperAdmin || $isDefaultTechnical;
        
        // Default technical should have same privileges as super-admin
        $hasAdminPrivileges = $isSuperAdmin || $isDefaultTechnical;

        // Get technical instructions if user is technical
        $technicalInstructions = [];
        if ($currentTechnical && $currentTechnical->instructions) {
            // Debug: Log the raw instructions
            Log::info('Technical instructions found:', [
                'technical_id' => $currentTechnical->id,
                'technical_email' => $currentTechnical->email,
                'raw_instructions' => $currentTechnical->instructions
            ]);
            
            // Get unread instructions (last 10)
            $technicalInstructions = collect($currentTechnical->instructions)
                ->filter(function ($instruction) {
                    return !$instruction['read']; // Solo instrucciones no leídas
                })
                ->take(10) // Últimas 10
                ->values()
                ->toArray();
                
            Log::info('Filtered unread instructions:', $technicalInstructions);
        } else {
            Log::info('No technical or instructions found:', [
                'currentTechnical' => $currentTechnical ? $currentTechnical->id : null,
                'has_instructions' => $currentTechnical ? !empty($currentTechnical->instructions) : false
            ]);
        }

        // Base query para tickets según rol
        $ticketsQuery = Ticket::query();
        if (!$hasAdminPrivileges) {
            // Si no tiene privilegios de admin, filtrar según el rol
            if ($user->hasRole('tenant')) {
                $ticketsQuery->where('user_id', $user->id);
            } elseif ($user->hasRole('technical') && !$isDefaultTechnical) {
                // Technical normal solo ve sus tickets asignados
                $technical = Technical::where('email', $user->email)->first();
                if ($technical) {
                    $ticketsQuery->where('technical_id', $technical->id);
                }
            } elseif (($isOwner || $isDoorman) && $buildingId) {
                // Owner/Doorman only see tickets from their building
                $ticketsQuery->whereHas('user.tenant.apartment', function($query) use ($buildingId) {
                    $query->where('buildings_id', $buildingId);
                });
            }
        }

        // Métricas principales de tickets
        $totalTickets = $ticketsQuery->count();
        $openTickets = (clone $ticketsQuery)->where('status', 'open')->count();
        $inProgressTickets = (clone $ticketsQuery)->where('status', 'in_progress')->count();
        $resolvedTickets = (clone $ticketsQuery)->where('status', 'resolved')->count();
        $unassignedTickets = (clone $ticketsQuery)->whereNull('technical_id')->count();

        // Métricas de recursos según rol
        if ($hasAdminPrivileges) {
            // Super-admin and default technical see all system metrics
            $totalBuildings = Building::count();
            $totalApartments = Apartment::count();
            $totalTenants = Tenant::count();
            $totalDevices = Device::count();
            $totalTechnicals = Technical::where('status', true)->count();
        } elseif (($isOwner || $isDoorman) && $buildingId) {
            // Owner/Doorman see metrics for their building
            $totalBuildings = 1; // They manage one building
            $totalApartments = Apartment::where('buildings_id', $buildingId)->count();
            $totalTenants = Tenant::whereHas('apartment', function($query) use ($buildingId) {
                $query->where('buildings_id', $buildingId);
            })->count();
            $totalDevices = Device::whereHas('tenants.apartment', function($query) use ($buildingId) {
                $query->where('buildings_id', $buildingId);
            })->count();
            $totalTechnicals = Technical::where('status', true)->count(); // All active technicals
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
        if ($hasAdminPrivileges) {
            // Super-admin and default technical see all technicals
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

        // Edificios con información detallada según rol
        if ($hasAdminPrivileges) {
            // Super-admin and default technical see all buildings
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
        } elseif (($isOwner || $isDoorman) && $buildingId) {
            // Owner/Doorman see apartment-level breakdown for their building
            $buildingsWithTickets = Apartment::where('buildings_id', $buildingId)
                ->leftJoin('tenants', 'apartments.id', '=', 'tenants.apartment_id')
                ->leftJoin('users', 'tenants.email', '=', 'users.email')
                ->leftJoin('tickets', 'users.id', '=', 'tickets.user_id')
                ->select(
                    'apartments.id',
                    'apartments.name',
                    DB::raw('NULL as image'),
                    DB::raw('1 as apartments_count'),
                    DB::raw('COUNT(DISTINCT tenants.id) as tenants_count'),
                    DB::raw('COUNT(tickets.id) as tickets_count')
                )
                ->groupBy('apartments.id', 'apartments.name')
                ->orderBy('apartments.name')
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
        if ($hasAdminPrivileges) {
            // Super-admin and default technical see all devices
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

        // Dispositivos más problemáticos - para admin y default technical
        if ($hasAdminPrivileges) {
            // Super-admin and default technical see problematic devices
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

        // Próximas citas - filtradas por rol de usuario
        $upcomingAppointments = collect();
        if ($user->hasRole('technical')) {
            // Técnicos ven solo sus citas
            $technical = Technical::where('email', $user->email)->first();
            if ($technical) {
                $upcomingAppointments = Appointment::with([
                    'ticket' => function($query) {
                        $query->select('id', 'title', 'code', 'user_id', 'device_id');
                    },
                    'ticket.user' => function($query) {
                        $query->select('id', 'name', 'email');
                    },
                    'ticket.device' => function($query) {
                        $query->select('id', 'name');
                    },
                    'ticket.device.tenants' => function($query) {
                        $query->select('tenants.id', 'tenants.apartment_id')->distinct();
                    },
                    'ticket.device.tenants.apartment' => function($query) {
                        $query->select('id', 'buildings_id', 'name');
                    },
                    'ticket.device.tenants.apartment.building' => function($query) {
                        $query->select('id', 'name', 'address', 'location_link');
                    },
                    'technical' => function($query) {
                        $query->select('id', 'name', 'email');
                    }
                ])
                    ->where('technical_id', $technical->id)
                    ->where(function($query) {
                        // Include upcoming appointments OR appointments in progress from today
                        $query->where('scheduled_for', '>=', Carbon::now())
                              ->orWhere(function($subQuery) {
                                  $subQuery->whereDate('scheduled_for', Carbon::today())
                                           ->where('status', 'in_progress');
                              });
                    })
                    ->where('status', '!=', 'cancelled')
                    ->orderBy('scheduled_for')
                    ->limit(10)
                    ->get();
            }
        } elseif ($user->hasRole('member')) {
            // Miembros ven citas de sus tickets
            $upcomingAppointments = Appointment::with([
                'ticket' => function($query) {
                    $query->select('id', 'title', 'code', 'user_id', 'device_id');
                },
                'ticket.user' => function($query) {
                    $query->select('id', 'name', 'email');
                },
                'ticket.device' => function($query) {
                    $query->select('id', 'name');
                },
                'ticket.device.tenants' => function($query) {
                    $query->select('tenants.id', 'tenants.apartment_id')->distinct();
                },
                'ticket.device.tenants.apartment' => function($query) {
                    $query->select('id', 'buildings_id', 'name');
                },
                'ticket.device.tenants.apartment.building' => function($query) {
                    $query->select('id', 'name', 'address', 'location_link');
                },
                'technical' => function($query) {
                    $query->select('id', 'name', 'email');
                }
            ])
                ->whereHas('ticket', function($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->where('scheduled_for', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->orderBy('scheduled_for')
                ->limit(10)
                ->get();
        } elseif (($isOwner || $isDoorman) && $buildingId) {
            // Owner/Doorman ven citas de tickets de su edificio
            $upcomingAppointments = Appointment::with([
                'ticket' => function($query) {
                    $query->select('id', 'title', 'code', 'user_id', 'device_id');
                },
                'ticket.user' => function($query) {
                    $query->select('id', 'name', 'email');
                },
                'ticket.device' => function($query) {
                    $query->select('id', 'name');
                },
                'ticket.device.tenants' => function($query) {
                    $query->select('tenants.id', 'tenants.apartment_id')->distinct();
                },
                'ticket.device.tenants.apartment' => function($query) {
                    $query->select('id', 'buildings_id', 'name');
                },
                'ticket.device.tenants.apartment.building' => function($query) {
                    $query->select('id', 'name', 'address', 'location_link');
                },
                'technical' => function($query) {
                    $query->select('id', 'name', 'email');
                }
            ])
                ->whereHas('ticket.user.tenant.apartment', function($query) use ($buildingId) {
                    $query->where('buildings_id', $buildingId);
                })
                ->where('scheduled_for', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->orderBy('scheduled_for')
                ->limit(10)
                ->get();
        } elseif ($hasAdminPrivileges) {
            // Super admin and default technical see all upcoming appointments
            $upcomingAppointments = Appointment::with([
                'ticket' => function($query) {
                    $query->select('id', 'title', 'code', 'user_id', 'device_id');
                },
                'ticket.user' => function($query) {
                    $query->select('id', 'name', 'email');
                },
                'ticket.device' => function($query) {
                    $query->select('id', 'name');
                },
                'ticket.device.tenants' => function($query) {
                    $query->select('tenants.id', 'tenants.apartment_id')->distinct();
                },
                'ticket.device.tenants.apartment' => function($query) {
                    $query->select('id', 'buildings_id', 'name');
                },
                'ticket.device.tenants.apartment.building' => function($query) {
                    $query->select('id', 'name', 'address', 'location_link');
                },
                'technical' => function($query) {
                    $query->select('id', 'name', 'email');
                }
            ])
                ->where('scheduled_for', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->orderBy('scheduled_for')
                ->limit(10)
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
                'upcomingAppointments' => $upcomingAppointments,
            ],
            'googleMapsApiKey' => env('GMAPS_API_KEY'),
            'technicalInstructions' => $technicalInstructions,
            'currentTechnical' => $currentTechnical ? [
                'id' => $currentTechnical->id,
                'name' => $currentTechnical->name,
                'is_default' => $currentTechnical->is_default,
            ] : null,
        ]);
    }

    public function markInstructionAsRead(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasRole('technical')) {
            return response()->json(['error' => 'Only technicals can mark instructions as read'], 403);
        }

        $technical = Technical::where('email', $user->email)->first();
        
        if (!$technical) {
            return response()->json(['error' => 'Technical not found'], 404);
        }

        $instructionIndex = $request->input('instruction_index');
        
        if ($technical->instructions && isset($technical->instructions[$instructionIndex])) {
            $instructions = $technical->instructions;
            $instructions[$instructionIndex]['read'] = true;
            
            $technical->update(['instructions' => $instructions]);
            
            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'Instruction not found'], 404);
    }
}
