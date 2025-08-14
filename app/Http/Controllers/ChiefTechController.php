<?php

namespace App\Http\Controllers;

use App\Models\Technical;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Building;
use App\Models\Device;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ChiefTechController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'chief_tech']);
    }

    /**
     * Chief Tech Dashboard with comprehensive metrics and management capabilities
     */
    public function dashboard()
    {
        $user = Auth::user();

        // Get Chief Tech's own technical record if exists
        $chiefTechnical = null;
        if ($user->hasRole('technical')) {
            $chiefTechnical = Technical::where('email', $user->email)->first();
        }

        // ===== TEAM MANAGEMENT METRICS =====
        $teamMetrics = $this->getTeamMetrics();

        // ===== TICKET MANAGEMENT METRICS =====
        $ticketMetrics = $this->getTicketMetrics();

        // ===== TECHNICIAN PERFORMANCE =====
        $technicianPerformance = $this->getTechnicianPerformance();

        // ===== APPOINTMENT SCHEDULING =====
        $appointmentData = $this->getAppointmentData();

        // ===== SYSTEM OVERVIEW =====
        $systemOverview = $this->getSystemOverview();

        // ===== RECENT ACTIVITIES =====
        $recentActivities = $this->getRecentActivities();

        return Inertia::render('ChiefTechDashboard', [
            'teamMetrics' => $teamMetrics,
            'ticketMetrics' => $ticketMetrics,
            'technicianPerformance' => $technicianPerformance,
            'appointmentData' => $appointmentData,
            'systemOverview' => $systemOverview,
            'recentActivities' => $recentActivities,
            'chiefTechnical' => $chiefTechnical,
            'canManageTeam' => true,
            'canAssignTickets' => true,
            'canScheduleAppointments' => true,
        ]);
    }

    /**
     * Get team management metrics
     */
    private function getTeamMetrics()
    {
        $totalTechnicians = Technical::where('status', true)->count();
        $activeTechnicians = Technical::where('status', true)
            ->whereHas('tickets', function($query) {
                $query->whereIn('status', ['open', 'in_progress'])
                      ->where('updated_at', '>=', Carbon::now()->subDays(7));
            })->count();

        $techniciansOnShift = [
            'morning' => Technical::where('status', true)->where('shift', 'morning')->count(),
            'afternoon' => Technical::where('status', true)->where('shift', 'afternoon')->count(),
            'night' => Technical::where('status', true)->where('shift', 'night')->count(),
        ];

        $availableTechnicians = Technical::where('status', true)
            ->whereDoesntHave('appointments', function($query) {
                $query->whereDate('scheduled_for', Carbon::today())
                      ->whereTime('scheduled_for', '<=', Carbon::now()->addHour())
                      ->whereTime('scheduled_for', '>=', Carbon::now()->subHour())
                      ->where('status', 'scheduled');
            })->count();

        return [
            'total_technicians' => $totalTechnicians,
            'active_technicians' => $activeTechnicians,
            'available_technicians' => $availableTechnicians,
            'technicians_on_shift' => $techniciansOnShift,
        ];
    }

    /**
     * Get comprehensive ticket metrics
     */
    private function getTicketMetrics()
    {
        $totalTickets = Ticket::count();
        $unassignedTickets = Ticket::whereNull('technical_id')
            ->whereNotIn('status', ['resolved', 'closed', 'cancelled'])
            ->count();
        
        $urgentTickets = Ticket::whereIn('status', ['open', 'in_progress'])
            ->where(function($query) {
                $query->whereIn('category', ['Urgente', 'Red', 'Hardware'])
                      ->orWhere('title', 'like', '%urgente%')
                      ->orWhere('description', 'like', '%urgente%');
            })->count();

        $overdueTickets = Ticket::where('status', 'open')
            ->where('created_at', '<', Carbon::now()->subDays(3))
            ->count();

        $todayTickets = Ticket::whereDate('created_at', Carbon::today())->count();

        $ticketsByStatus = Ticket::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $ticketsByCategory = Ticket::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->get()
            ->pluck('count', 'category');

        $avgResolutionTime = Ticket::where('status', 'resolved')
            ->whereNotNull('resolved_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours'))
            ->first();

        return [
            'total_tickets' => $totalTickets,
            'unassigned_tickets' => $unassignedTickets,
            'urgent_tickets' => $urgentTickets,
            'overdue_tickets' => $overdueTickets,
            'today_tickets' => $todayTickets,
            'tickets_by_status' => $ticketsByStatus,
            'tickets_by_category' => $ticketsByCategory,
            'avg_resolution_hours' => $avgResolutionTime ? round($avgResolutionTime->avg_hours, 1) : 0,
        ];
    }

    /**
     * Get technician performance data
     */
    private function getTechnicianPerformance()
    {
        $technicians = Technical::where('status', true)
            ->withCount([
                'tickets as total_tickets',
                'tickets as open_tickets' => function($query) {
                    $query->where('status', 'open');
                },
                'tickets as in_progress_tickets' => function($query) {
                    $query->where('status', 'in_progress');
                },
                'tickets as resolved_tickets' => function($query) {
                    $query->where('status', 'resolved');
                },
                'appointments as total_appointments',
                'appointments as upcoming_appointments' => function($query) {
                    $query->where('scheduled_for', '>=', Carbon::now())
                          ->where('status', '!=', 'cancelled');
                }
            ])
            ->with([
                'tickets' => function($query) {
                    $query->select('id', 'technical_id', 'status', 'created_at', 'resolved_at')
                          ->where('status', 'resolved')
                          ->whereNotNull('resolved_at')
                          ->latest('resolved_at')
                          ->limit(5);
                }
            ])
            ->get()
            ->map(function($tech) {
                // Calculate average resolution time for this technician
                $avgResolution = $tech->tickets()
                    ->where('status', 'resolved')
                    ->whereNotNull('resolved_at')
                    ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours'))
                    ->first();

                $tech->avg_resolution_hours = $avgResolution ? round($avgResolution->avg_hours, 1) : 0;

                // Calculate productivity score
                $productivityScore = 0;
                if ($tech->total_tickets > 0) {
                    $resolutionRate = ($tech->resolved_tickets / $tech->total_tickets) * 100;
                    $speedBonus = $tech->avg_resolution_hours > 0 ? max(0, 100 - $tech->avg_resolution_hours) : 0;
                    $productivityScore = min(100, ($resolutionRate * 0.7) + ($speedBonus * 0.3));
                }
                $tech->productivity_score = round($productivityScore, 1);

                return $tech;
            });

        return $technicians;
    }

    /**
     * Get appointment scheduling data
     */
    private function getAppointmentData()
    {
        $todayAppointments = Appointment::with(['technical', 'ticket'])
            ->whereDate('scheduled_for', Carbon::today())
            ->orderBy('scheduled_for')
            ->get();

        $upcomingAppointments = Appointment::with(['technical', 'ticket'])
            ->where('scheduled_for', '>', Carbon::now())
            ->where('scheduled_for', '<=', Carbon::now()->addDays(7))
            ->orderBy('scheduled_for')
            ->limit(20)
            ->get();

        $appointmentsByStatus = Appointment::select('status', DB::raw('count(*) as count'))
            ->whereDate('scheduled_for', '>=', Carbon::today())
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        return [
            'today_appointments' => $todayAppointments,
            'upcoming_appointments' => $upcomingAppointments,
            'appointments_by_status' => $appointmentsByStatus,
        ];
    }

    /**
     * Get system overview data
     */
    private function getSystemOverview()
    {
        $totalBuildings = Building::count();
        $totalDevices = Device::count();
        $totalUsers = User::count();

        $systemHealth = [
            'devices_online' => Device::where('status', 'active')->count(),
            'devices_offline' => Device::where('status', 'inactive')->count(),
            'critical_alerts' => 0, // This would come from monitoring system
        ];

        $recentIssues = Ticket::where('created_at', '>=', Carbon::now()->subDays(7))
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        return [
            'total_buildings' => $totalBuildings,
            'total_devices' => $totalDevices,
            'total_users' => $totalUsers,
            'system_health' => $systemHealth,
            'recent_issues' => $recentIssues,
        ];
    }

    /**
     * Get recent activities
     */
    private function getRecentActivities()
    {
        $recentTickets = Ticket::with(['user', 'technical', 'device'])
            ->latest('created_at')
            ->limit(10)
            ->get();

        $recentAppointments = Appointment::with(['technical', 'ticket'])
            ->latest('created_at')
            ->limit(10)
            ->get();

        $recentAssignments = Ticket::with(['user', 'technical'])
            ->whereNotNull('technical_id')
            ->latest('updated_at')
            ->limit(10)
            ->get();

        return [
            'recent_tickets' => $recentTickets,
            'recent_appointments' => $recentAppointments,
            'recent_assignments' => $recentAssignments,
        ];
    }

    /**
     * Assign ticket to technician
     */
    public function assignTicket(Request $request)
    {
        $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'technical_id' => 'required|exists:technicals,id',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'notes' => 'nullable|string|max:500',
        ]);

        $ticket = Ticket::findOrFail($request->ticket_id);
        $technical = Technical::findOrFail($request->technical_id);

        $ticket->update([
            'technical_id' => $technical->id,
            'status' => 'in_progress',
            'priority' => $request->priority ?? $ticket->priority,
        ]);

        // Log the assignment
        Log::info('Chief Tech assigned ticket', [
            'ticket_id' => $ticket->id,
            'technical_id' => $technical->id,
            'assigned_by' => Auth::user()->id,
            'notes' => $request->notes,
        ]);

        return back()->with('success', "Ticket assigned to {$technical->name} successfully");
    }

    /**
     * Bulk assign tickets
     */
    public function bulkAssignTickets(Request $request)
    {
        $request->validate([
            'ticket_ids' => 'required|array',
            'ticket_ids.*' => 'exists:tickets,id',
            'technical_id' => 'required|exists:technicals,id',
        ]);

        $technical = Technical::findOrFail($request->technical_id);
        $assigned = 0;

        foreach ($request->ticket_ids as $ticketId) {
            $ticket = Ticket::find($ticketId);
            if ($ticket && !$ticket->technical_id) {
                $ticket->update([
                    'technical_id' => $technical->id,
                    'status' => 'in_progress',
                ]);
                $assigned++;
            }
        }

        Log::info('Chief Tech bulk assigned tickets', [
            'tickets_assigned' => $assigned,
            'technical_id' => $technical->id,
            'assigned_by' => Auth::user()->id,
        ]);

        return back()->with('success', "Successfully assigned {$assigned} tickets to {$technical->name}");
    }

    /**
     * Get unassigned tickets for assignment
     */
    public function getUnassignedTickets()
    {
        $tickets = Ticket::with(['user.tenant.apartment.building', 'device'])
            ->whereNull('technical_id')
            ->whereNotIn('status', ['resolved', 'closed', 'cancelled'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($tickets);
    }

    /**
     * Get available technicians for assignment
     */
    public function getAvailableTechnicians()
    {
        $technicians = Technical::where('status', true)
            ->withCount([
                'tickets as active_tickets' => function($query) {
                    $query->whereIn('status', ['open', 'in_progress']);
                },
                'appointments as today_appointments' => function($query) {
                    $query->whereDate('scheduled_for', Carbon::today());
                }
            ])
            ->orderBy('active_tickets')
            ->get();

        return response()->json($technicians);
    }

    /**
     * Update technician status
     */
    public function updateTechnicianStatus(Request $request, Technical $technical)
    {
        $request->validate([
            'status' => 'required|boolean',
            'reason' => 'nullable|string|max:255',
        ]);

        $technical->update(['status' => $request->status]);

        $action = $request->status ? 'activated' : 'deactivated';
        
        Log::info("Chief Tech {$action} technician", [
            'technical_id' => $technical->id,
            'technical_name' => $technical->name,
            'reason' => $request->reason,
            'updated_by' => Auth::user()->id,
        ]);

        return back()->with('success', "Technician {$action} successfully");
    }

    /**
     * Send instructions to technician
     */
    public function sendInstructions(Request $request, Technical $technical)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'priority' => 'required|in:low,medium,high,urgent',
            'category' => 'required|string|max:50',
        ]);

        $instructions = $technical->instructions ?? [];
        
        $newInstruction = [
            'id' => uniqid(),
            'message' => $request->message,
            'priority' => $request->priority,
            'category' => $request->category,
            'sent_by' => Auth::user()->name,
            'sent_at' => Carbon::now()->toISOString(),
            'read' => false,
        ];

        array_unshift($instructions, $newInstruction);
        
        // Keep only last 50 instructions
        $instructions = array_slice($instructions, 0, 50);

        $technical->update(['instructions' => $instructions]);

        Log::info('Chief Tech sent instructions', [
            'technical_id' => $technical->id,
            'instruction_id' => $newInstruction['id'],
            'priority' => $request->priority,
            'sent_by' => Auth::user()->id,
        ]);

        return back()->with('success', 'Instructions sent successfully');
    }

    /**
     * Schedule appointment
     */
    public function scheduleAppointment(Request $request)
    {
        $request->validate([
            'ticket_id' => 'required|exists:tickets,id',
            'technical_id' => 'required|exists:technicals,id',
            'scheduled_for' => 'required|date|after:now',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'estimated_duration' => 'nullable|integer|min:15|max:480', // 15 minutes to 8 hours
        ]);

        $appointment = Appointment::create([
            'ticket_id' => $request->ticket_id,
            'technical_id' => $request->technical_id,
            'scheduled_for' => $request->scheduled_for,
            'title' => $request->title,
            'description' => $request->description,
            'estimated_duration' => $request->estimated_duration ?? 60,
            'status' => 'scheduled',
        ]);

        Log::info('Chief Tech scheduled appointment', [
            'appointment_id' => $appointment->id,
            'ticket_id' => $request->ticket_id,
            'technical_id' => $request->technical_id,
            'scheduled_by' => Auth::user()->id,
        ]);

        return back()->with('success', 'Appointment scheduled successfully');
    }

    /**
     * Get team performance analytics
     */
    public function getTeamAnalytics(Request $request)
    {
        $period = $request->input('period', '30'); // days
        $startDate = Carbon::now()->subDays($period);

        $analytics = [
            'team_efficiency' => $this->calculateTeamEfficiency($startDate),
            'resolution_trends' => $this->getResolutionTrends($startDate),
            'workload_distribution' => $this->getWorkloadDistribution(),
            'performance_metrics' => $this->getPerformanceMetrics($startDate),
        ];

        return response()->json($analytics);
    }

    private function calculateTeamEfficiency($startDate)
    {
        $totalTickets = Ticket::where('created_at', '>=', $startDate)->count();
        $resolvedTickets = Ticket::where('created_at', '>=', $startDate)
            ->where('status', 'resolved')->count();
        
        $efficiency = $totalTickets > 0 ? ($resolvedTickets / $totalTickets) * 100 : 0;
        
        return round($efficiency, 1);
    }

    private function getResolutionTrends($startDate)
    {
        return Ticket::where('resolved_at', '>=', $startDate)
            ->where('status', 'resolved')
            ->select(
                DB::raw('DATE(resolved_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();
    }

    private function getWorkloadDistribution()
    {
        return Technical::where('status', true)
            ->withCount([
                'tickets as active_tickets' => function($query) {
                    $query->whereIn('status', ['open', 'in_progress']);
                }
            ])
            ->select('id', 'name', 'shift')
            ->get();
    }

    private function getPerformanceMetrics($startDate)
    {
        return Technical::where('status', true)
            ->with([
                'tickets' => function($query) use ($startDate) {
                    $query->where('created_at', '>=', $startDate);
                }
            ])
            ->get()
            ->map(function($tech) {
                $tickets = $tech->tickets;
                $resolved = $tickets->where('status', 'resolved');
                
                return [
                    'id' => $tech->id,
                    'name' => $tech->name,
                    'total_tickets' => $tickets->count(),
                    'resolved_tickets' => $resolved->count(),
                    'resolution_rate' => $tickets->count() > 0 ? 
                        round(($resolved->count() / $tickets->count()) * 100, 1) : 0,
                    'avg_resolution_time' => $resolved->count() > 0 ?
                        round($resolved->avg(function($ticket) {
                            return $ticket->resolved_at ? 
                                $ticket->created_at->diffInHours($ticket->resolved_at) : 0;
                        }), 1) : 0,
                ];
            });
    }
}
