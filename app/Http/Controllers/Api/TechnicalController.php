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
     * Get detailed information about a specific ticket (with full timeline like tenant endpoint)
     */
    public function getTicketDetail($ticketId)
    {
        Log::info("🔥 LLEGÓ PETICIÓN AL MÉTODO getTicketDetail", [
            'ticket_id' => $ticketId,
            'method' => request()->method(),
            'url' => request()->fullUrl()
        ]);
        
        try {
            Log::info("✅ Dentro del try, buscando ticket...");
            
            // Buscar el ticket con todas las relaciones necesarias
            $ticket = Ticket::with([
                'device.brand',
                'device.model',
                'device.system',
                'device.name_device',
                'technical',
                'user', // Member que creó el ticket
                'user.tenant', // Datos del tenant
                'user.tenant.apartment', // Apartamento del tenant
                'user.tenant.apartment.building', // Edificio
                'histories' => function ($query) {
                    $query->orderBy('created_at', 'desc');
                },
                'histories.technical'
            ])->find($ticketId);

            Log::info("Resultado búsqueda ticket", [
                'found' => $ticket ? true : false,
                'ticket_id' => $ticket ? $ticket->id : null
            ]);

            if (!$ticket) {
                Log::warning("❌ Ticket no encontrado, retornando 404", ['ticket_id' => $ticketId]);
                return response()->json(['error' => 'Ticket not found'], 404);
            }

            Log::info("✅ Construyendo response...");
            
            // Construir response idéntico al de tenant
            return response()->json([
                'ticket' => [
                    'id' => $ticket->id,
                    'title' => $ticket->title,
                    'description' => $ticket->description,
                    'category' => $ticket->category,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at,
                    'updated_at' => $ticket->updated_at,
                    'attachments' => $ticket->attachments ?? [],
                    'device' => $ticket->device ? [
                        'id' => $ticket->device->id,
                        'name' => $ticket->device->name,
                        'brand' => $ticket->device->brand?->name,
                        'model' => $ticket->device->model?->name,
                        'system' => $ticket->device->system?->name,
                        'device_type' => $ticket->device->name_device?->name,
                        'ubicacion' => $ticket->device->ubicacion,
                        'icon_id' => $ticket->device->icon_id,
                        'device_image' => $ticket->device->name_device?->image,
                        'name_device' => $ticket->device->name_device ? [
                            'id' => $ticket->device->name_device->id,
                            'name' => $ticket->device->name_device->name,
                            'status' => $ticket->device->name_device->status,
                            'image' => $ticket->device->name_device->image
                        ] : null,
                    ] : null,
                    'technical' => $ticket->technical ? [
                        'id' => $ticket->technical->id,
                        'name' => $ticket->technical->name,
                        'email' => $ticket->technical->email,
                        'phone' => $ticket->technical->phone,
                        'photo' => $ticket->technical->photo,
                        'shift' => $ticket->technical->shift,
                    ] : null,
                    'member' => $ticket->user ? [
                        'id' => $ticket->user->id,
                        'name' => $ticket->user->name,
                        'email' => $ticket->user->email,
                        'phone' => $ticket->user->tenant?->phone,
                        'photo' => $ticket->user->tenant?->photo,
                        'apartment' => $ticket->user->tenant?->apartment ? [
                            'id' => $ticket->user->tenant->apartment->id,
                            'number' => $ticket->user->tenant->apartment->number,
                            'building' => $ticket->user->tenant->apartment->building ? [
                                'id' => $ticket->user->tenant->apartment->building->id,
                                'name' => $ticket->user->tenant->apartment->building->name,
                                'address' => $ticket->user->tenant->apartment->building->address,
                            ] : null,
                        ] : null,
                    ] : null,
                    'histories' => $ticket->histories->map(function ($history) {
                        return [
                            'id' => $history->id,
                            'action' => $history->action,
                            'description' => $history->description,
                            'user_name' => $history->user_name,
                            'created_at' => $history->created_at,
                            'technical' => $history->technical ? [
                                'id' => $history->technical->id,
                                'name' => $history->technical->name,
                            ] : null,
                        ];
                    }),
                ]
            ]);
            
            Log::info("🎉 Response construido exitosamente, retornando JSON", [
                'ticket_id' => $ticket->id,
                'has_device' => $ticket->device ? true : false,
                'has_technical' => $ticket->technical ? true : false,
                'histories_count' => $ticket->histories->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error("💥 EXCEPCIÓN CAPTURADA en getTicketDetail", [
                'ticket_id' => $ticketId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Error al obtener detalle del ticket',
                'message' => $e->getMessage()
            ], 500);
        }
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
