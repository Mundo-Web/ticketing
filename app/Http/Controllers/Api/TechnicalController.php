<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Technical;
use App\Models\Ticket;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TechnicalController extends Controller
{
    /**
     * List all technicals (for jefe view)
     */
    public function index()
    {
        $technicals = Technical::select('id', 'name', 'email', 'photo', 'shift', 'status', 'is_default')->get();
        Log::info('API /api/technicals called. Count: ' . $technicals->count());
        return response()->json(['technicals' => $technicals]);
    }

    /**
     * Get tickets for a specific technical (including default technicals)
     */
    public function getTickets(Request $request, $technicalId)
    {
        Log::info('🔍 tickets endpoint called', ['technical_id' => $technicalId, 'type' => $request->get('type', 'all')]);
        try {
            $technical = Technical::findOrFail($technicalId);
            $type = $request->get('type', 'all');

            $query = Ticket::with([
                'device.brand',
                'device.model',
                'device.system',
                'device.name_device',
                'technical',
                'histories'
            ]);

            if (! $technical->is_default) {
                $query->where('technical_id', $technicalId);
            }

            switch ($type) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'week':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]);
                    break;
                case 'open':
                    $query->where('status', 'open');
                    break;
                case 'in_progress':
                    $query->where('status', 'in_progress');
                    break;
                case 'resolved':
                    $query->where('status', 'resolved');
                    break;
                case 'closed':
                    $query->where('status', 'closed');
                    break;
                case 'recent':
                    $query->where('created_at', '>=', now()->subDays(7))
                          ->whereIn('status', ['resolved', 'closed']);
                    break;
                case 'all':
                default:
                    // no extra filter
                    break;
            }

            $tickets = $query->latest()->get();

            $mappedTickets = $tickets->map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'title' => $ticket->title,
                    'description' => $ticket->description,
                    'category' => $ticket->category,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority ?? 'medium',
                    'created_at' => $ticket->created_at,
                    'updated_at' => $ticket->updated_at,
                    'device' => $ticket->device ? [
                        'id' => $ticket->device->id,
                        'name' => $ticket->device->name,
                        'brand' => $ticket->device->brand ? $ticket->device->brand->name : null,
                        'model' => $ticket->device->model ? $ticket->device->model->name : null,
                        'system' => $ticket->device->system ? $ticket->device->system->name : null,
                        'device_type' => $ticket->device->name_device ? $ticket->device->name_device->name : null,
                        'icon_id' => $ticket->device->icon_id ?? null,
                        'device_image' => $ticket->device->image ?? null,
                        'ubicacion' => $ticket->device->ubicacion ?? null,
                        'name_device' => $ticket->device->name_device ? [
                            'id' => $ticket->device->name_device->id,
                            'name' => $ticket->device->name_device->name,
                            'status' => $ticket->device->name_device->status,
                            'image' => $ticket->device->name_device->image,
                        ] : null,
                    ] : null,
                    'technical' => $ticket->technical ? [
                        'id' => $ticket->technical->id,
                        'name' => $ticket->technical->name,
                        'email' => $ticket->technical->email,
                        'phone' => $ticket->technical->phone,
                        'photo' => $ticket->technical->photo,
                    ] : null,
                    'histories_count' => $ticket->histories->count(),
                ];
            });

            Log::info('✅ tickets retrieved', ['count' => $mappedTickets->count()]);
            return response()->json($mappedTickets);
        } catch (\Exception $e) {
            Log::error('❌ ERROR in tickets endpoint', [
                'technical_id' => $technicalId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Error al obtener tickets',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed information about a specific ticket
     */
    public function getTicketDetail($ticketId)
    {
        $ticket = Ticket::with([
            'building:id,name,address',
            'device:id,name',
            'device.brand:id,name',
            'device.model:id,name',
            'apartment:id,number',
            'tenant:id,name,email,phone',
            'history' => function($query) {
                $query->with('user:id,name')->orderBy('created_at', 'desc');
            },
            'comments' => function($query) {
                $query->with('user:id,name')->orderBy('created_at', 'desc');
            }
        ])->findOrFail($ticketId);

        if ($ticket->status === 'resolved' && $ticket->resolved_at) {
            $ticket->resolution_time = $ticket->created_at->diffInHours($ticket->resolved_at);
        }

        if ($ticket->status === 'resolved') {
            $ticket->rating = rand(3,5);
            $ticket->feedback = [
                "Great job! Very professional service.",
                "Quick resolution, thank you!",
                "Excellent technical support.",
                "Very satisfied with the service.",
                "Outstanding work, highly recommend!"
            ][rand(0,4)];
        }

        return response()->json($ticket);
    }

    /**
     * Get appointments for a specific technical
     */
    public function getAppointments(Request $request, $technicalId)
    {
        $technical = Technical::findOrFail($technicalId);
        $date = $request->get('date');

        $query = Appointment::where('technical_id', $technical->id)
            ->with([
                'ticket:id,title,status,priority,user_id,device_id',
                'ticket.device:id,name',
                'ticket.apartment:id,number,building_id',
                'ticket.apartment.building:id,name,address',
                'ticket.user:id,name,email',
                'ticket.user.tenant:user_id,phone'
            ]);

        if ($date) {
            $query->whereDate('scheduled_for', $date);
        }

        $appointments = $query->orderBy('scheduled_for')->get();

        $appointments = $appointments->map(function($appointment) {
            if ($appointment->ticket && $appointment->ticket->user) {
                $appointment->tenant = [
                    'id' => $appointment->ticket->user->id,
                    'name' => $appointment->ticket->user->name,
                    'email' => $appointment->ticket->user->email,
                    'phone' => $appointment->ticket->user->tenant->phone ?? null,
                ];
            }
            return $appointment;
        });

        return response()->json($appointments);
    }
}
