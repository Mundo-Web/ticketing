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
     * GET /api/technicals/{technicalId}/appointments
     */
    public function getAppointments(Request $request, $technicalId)
    {
        Log::info('📅 Get appointments endpoint called', ['technical_id' => $technicalId]);
        
        try {
            $technical = Technical::findOrFail($technicalId);
            $date = $request->get('date');
            $status = $request->get('status'); // scheduled, in_progress, completed, etc.

            $query = Appointment::with([
                'ticket',
                'ticket.device',
                'ticket.device.tenants',
                'ticket.device.tenants.apartment',
                'ticket.device.tenants.apartment.building',
                'ticket.user',
                'ticket.user.tenant',
                'ticket.user.tenant.apartment',
                'ticket.user.tenant.apartment.building',
                'technical'
            ]);

            // Filter by technical (show all if is_default)
            if (!$technical->is_default) {
                $query->where('technical_id', $technical->id);
            }

            // Filter by date if provided
            if ($date) {
                $query->whereDate('scheduled_for', $date);
            }

            // Filter by status if provided
            if ($status) {
                $query->where('status', $status);
            }

            $appointments = $query->orderBy('scheduled_for')->get();

            // Map appointments to API format
            $mappedAppointments = $appointments->map(function($appointment) {
                return [
                    'id' => $appointment->id,
                    'title' => $appointment->title,
                    'description' => $appointment->description,
                    'address' => $appointment->address,
                    'scheduled_for' => $appointment->scheduled_for,
                    'estimated_duration' => $appointment->estimated_duration,
                    'estimated_end_time' => $appointment->estimated_end_time,
                    'status' => $appointment->status,
                    'member_instructions' => $appointment->member_instructions,
                    'notes' => $appointment->notes,
                    'completion_notes' => $appointment->completion_notes,
                    'started_at' => $appointment->started_at,
                    'completed_at' => $appointment->completed_at,
                    'service_rating' => $appointment->service_rating,
                    'member_feedback' => $appointment->member_feedback,
                    'ticket' => $appointment->ticket ? [
                        'id' => $appointment->ticket->id,
                        'title' => $appointment->ticket->title,
                        'status' => $appointment->ticket->status,
                        'priority' => $appointment->ticket->priority,
                        'category' => $appointment->ticket->category,
                        'device' => $appointment->ticket->device ? [
                            'id' => $appointment->ticket->device->id,
                            'name' => $appointment->ticket->device->name,
                            'ubicacion' => $appointment->ticket->device->ubicacion,
                        ] : null,
                    ] : null,
                    'technical' => $appointment->technical ? [
                        'id' => $appointment->technical->id,
                        'name' => $appointment->technical->name,
                        'email' => $appointment->technical->email,
                        'phone' => $appointment->technical->phone,
                        'photo' => $appointment->technical->photo,
                    ] : null,
                    'member' => $appointment->ticket && $appointment->ticket->user ? [
                        'id' => $appointment->ticket->user->id,
                        'name' => $appointment->ticket->user->name,
                        'email' => $appointment->ticket->user->email,
                        'phone' => $appointment->ticket->user->tenant?->phone,
                        'apartment' => $appointment->ticket->user->tenant?->apartment ? [
                            'number' => $appointment->ticket->user->tenant->apartment->number,
                            'building' => $appointment->ticket->user->tenant->apartment->building ? [
                                'name' => $appointment->ticket->user->tenant->apartment->building->name,
                                'address' => $appointment->ticket->user->tenant->apartment->building->address,
                            ] : null,
                        ] : null,
                    ] : null,
                ];
            });

            Log::info('✅ Appointments retrieved', ['count' => $mappedAppointments->count()]);
            return response()->json($mappedAppointments);
            
        } catch (\Exception $e) {
            Log::error('❌ ERROR in appointments endpoint', [
                'technical_id' => $technicalId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Error al obtener appointments',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appointment detail
     * GET /api/appointments/{appointmentId}/detail
     */
    public function getAppointmentDetail($appointmentId)
    {
        Log::info("📅 Get appointment detail endpoint called", ['appointment_id' => $appointmentId]);
        
        try {
            $appointment = Appointment::with([
                'ticket',
                'ticket.device',
                'ticket.device.tenants',
                'ticket.device.tenants.apartment',
                'ticket.device.tenants.apartment.building',
                'ticket.user',
                'ticket.user.tenant',
                'ticket.user.tenant.apartment',
                'ticket.user.tenant.apartment.building',
                'technical'
            ])->find($appointmentId);

            if (!$appointment) {
                Log::warning("❌ Appointment no encontrado", ['appointment_id' => $appointmentId]);
                return response()->json(['error' => 'Appointment not found'], 404);
            }

            return response()->json([
                'appointment' => [
                    'id' => $appointment->id,
                    'title' => $appointment->title,
                    'description' => $appointment->description,
                    'address' => $appointment->address,
                    'scheduled_for' => $appointment->scheduled_for,
                    'estimated_duration' => $appointment->estimated_duration,
                    'estimated_end_time' => $appointment->estimated_end_time,
                    'status' => $appointment->status,
                    'member_instructions' => $appointment->member_instructions,
                    'notes' => $appointment->notes,
                    'completion_notes' => $appointment->completion_notes,
                    'started_at' => $appointment->started_at,
                    'completed_at' => $appointment->completed_at,
                    'service_rating' => $appointment->service_rating,
                    'member_feedback' => $appointment->member_feedback,
                    'ticket' => $appointment->ticket ? [
                        'id' => $appointment->ticket->id,
                        'title' => $appointment->ticket->title,
                        'description' => $appointment->ticket->description,
                        'status' => $appointment->ticket->status,
                        'priority' => $appointment->ticket->priority,
                        'category' => $appointment->ticket->category,
                        'device' => $appointment->ticket->device ? [
                            'id' => $appointment->ticket->device->id,
                            'name' => $appointment->ticket->device->name,
                            'ubicacion' => $appointment->ticket->device->ubicacion,
                        ] : null,
                    ] : null,
                    'technical' => $appointment->technical ? [
                        'id' => $appointment->technical->id,
                        'name' => $appointment->technical->name,
                        'email' => $appointment->technical->email,
                        'phone' => $appointment->technical->phone,
                        'photo' => $appointment->technical->photo,
                        'shift' => $appointment->technical->shift,
                    ] : null,
                    'member' => $appointment->ticket && $appointment->ticket->user ? [
                        'id' => $appointment->ticket->user->id,
                        'name' => $appointment->ticket->user->name,
                        'email' => $appointment->ticket->user->email,
                        'phone' => $appointment->ticket->user->tenant?->phone,
                        'photo' => $appointment->ticket->user->tenant?->photo,
                        'apartment' => $appointment->ticket->user->tenant?->apartment ? [
                            'id' => $appointment->ticket->user->tenant->apartment->id,
                            'number' => $appointment->ticket->user->tenant->apartment->number,
                            'building' => $appointment->ticket->user->tenant->apartment->building ? [
                                'id' => $appointment->ticket->user->tenant->apartment->building->id,
                                'name' => $appointment->ticket->user->tenant->apartment->building->name,
                                'address' => $appointment->ticket->user->tenant->apartment->building->address,
                            ] : null,
                        ] : null,
                    ] : null,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error("💥 Error getting appointment detail", [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Error al obtener detalle del appointment',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start an appointment (technician arrives)
     * POST /api/appointments/{appointmentId}/start
     */
    public function startAppointment(Request $request, $appointmentId)
    {
        Log::info("▶️ Start appointment endpoint called", ['appointment_id' => $appointmentId]);
        
        try {
            $appointment = Appointment::findOrFail($appointmentId);
            
            // Verificar que el técnico autenticado sea el asignado
            $user = $request->user();
            $technical = Technical::where('email', $user->email)->first();
            
            if (!$technical) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only technicians can start appointments'
                ], 403);
            }

            if ($appointment->technical_id !== $technical->id && !$technical->is_default) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only start appointments assigned to you'
                ], 403);
            }

            // Start the appointment
            $appointment->start();

            Log::info("✅ Appointment started successfully", ['appointment_id' => $appointmentId]);

            return response()->json([
                'success' => true,
                'message' => 'Appointment started successfully',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'started_at' => $appointment->started_at,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Error starting appointment", [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error starting appointment: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Complete an appointment (Technical side)
     * POST /api/appointments/{appointmentId}/complete
     */
    public function completeAppointment(Request $request, $appointmentId)
    {
        Log::info("✅ Complete appointment endpoint called", ['appointment_id' => $appointmentId]);
        
        try {
            $validated = $request->validate([
                'completion_notes' => 'required|string|max:1000',
            ]);

            $appointment = Appointment::findOrFail($appointmentId);
            
            // Verificar que el técnico autenticado sea el asignado
            $user = $request->user();
            $technical = Technical::where('email', $user->email)->first();
            
            if (!$technical) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only technicians can complete appointments'
                ], 403);
            }

            if ($appointment->technical_id !== $technical->id && !$technical->is_default) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only complete appointments assigned to you'
                ], 403);
            }

            // Update appointment to awaiting_feedback
            $appointment->update([
                'status' => 'awaiting_feedback',
                'completion_notes' => $validated['completion_notes'],
                'completed_at' => now(),
            ]);

            // Add to ticket history
            if ($appointment->ticket_id) {
                $appointment->ticket->addHistory(
                    'technical_completed',
                    'Technical completed visit',
                    [
                        'appointment_id' => $appointment->id,
                        'completion_notes' => $validated['completion_notes']
                    ]
                );
            }

            Log::info("✅ Appointment completed successfully", ['appointment_id' => $appointmentId]);

            return response()->json([
                'success' => true,
                'message' => 'Visit completed successfully. Member will provide feedback.',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'completed_at' => $appointment->completed_at,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("❌ Error completing appointment", [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error completing appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel an appointment
     * POST /api/appointments/{appointmentId}/cancel
     */
    public function cancelAppointment(Request $request, $appointmentId)
    {
        Log::info("❌ Cancel appointment endpoint called", ['appointment_id' => $appointmentId]);
        
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $appointment = Appointment::findOrFail($appointmentId);
            
            // Verificar que el técnico autenticado sea el asignado
            $user = $request->user();
            $technical = Technical::where('email', $user->email)->first();
            
            if (!$technical) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only technicians can cancel appointments'
                ], 403);
            }

            if ($appointment->technical_id !== $technical->id && !$technical->is_default) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only cancel appointments assigned to you'
                ], 403);
            }

            // Cancel the appointment
            $appointment->cancel($validated['reason']);

            Log::info("✅ Appointment cancelled successfully", ['appointment_id' => $appointmentId]);

            return response()->json([
                'success' => true,
                'message' => 'Appointment cancelled successfully',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("❌ Error cancelling appointment", [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error cancelling appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reschedule an appointment
     * POST /api/appointments/{appointmentId}/reschedule
     */
    public function rescheduleAppointment(Request $request, $appointmentId)
    {
        Log::info("🔄 Reschedule appointment endpoint called", ['appointment_id' => $appointmentId]);
        
        try {
            $validated = $request->validate([
                'new_scheduled_for' => 'required|date',
                'reason' => 'nullable|string|max:500',
            ]);

            $appointment = Appointment::findOrFail($appointmentId);
            
            // Verificar que el técnico autenticado sea el asignado
            $user = $request->user();
            $technical = Technical::where('email', $user->email)->first();
            
            if (!$technical) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only technicians can reschedule appointments'
                ], 403);
            }

            if ($appointment->technical_id !== $technical->id && !$technical->is_default) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only reschedule appointments assigned to you'
                ], 403);
            }

            // Store old date before rescheduling
            $oldScheduledFor = $appointment->scheduled_for;
            
            // Reschedule the appointment
            $appointment->reschedule($validated['new_scheduled_for'], $validated['reason'] ?? null, $user);

            Log::info("✅ Appointment rescheduled successfully", ['appointment_id' => $appointmentId]);

            return response()->json([
                'success' => true,
                'message' => 'Appointment rescheduled successfully',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'old_scheduled_for' => $oldScheduledFor,
                    'new_scheduled_for' => $appointment->scheduled_for,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("❌ Error rescheduling appointment", [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error rescheduling appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark appointment as No Show
     * POST /api/appointments/{appointmentId}/no-show
     */
    public function markNoShow(Request $request, $appointmentId)
    {
        Log::info("⚠️ Mark no-show endpoint called", ['appointment_id' => $appointmentId]);
        
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:255',
                'description' => 'nullable|string|max:500',
            ]);

            $appointment = Appointment::findOrFail($appointmentId);
            
            // Verificar que el técnico autenticado sea el asignado
            $user = $request->user();
            $technical = Technical::where('email', $user->email)->first();
            
            if (!$technical) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only technicians can mark appointments as no-show'
                ], 403);
            }

            if ($appointment->technical_id !== $technical->id && !$technical->is_default) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only mark appointments assigned to you as no-show'
                ], 403);
            }

            // Update appointment status to no-show
            $appointment->status = 'no_show';
            $appointment->no_show_reason = $validated['reason'];
            $appointment->no_show_description = $validated['description'] ?? null;
            $appointment->marked_no_show_at = now();
            $appointment->marked_no_show_by = $user->id;
            $appointment->save();

            // Add to ticket timeline
            if ($appointment->ticket_id) {
                $appointment->ticket->addHistory(
                    'appointment_no_show',
                    "Appointment marked as No Show: {$validated['reason']}",
                    [
                        'appointment_id' => $appointment->id,
                        'reason' => $validated['reason'],
                        'description' => $validated['description'] ?? null
                    ]
                );
            }

            Log::info("✅ Appointment marked as no-show successfully", ['appointment_id' => $appointmentId]);

            return response()->json([
                'success' => true,
                'message' => 'Appointment marked as No Show successfully',
                'appointment' => [
                    'id' => $appointment->id,
                    'status' => $appointment->status,
                    'no_show_reason' => $appointment->no_show_reason,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("❌ Error marking appointment as no-show", [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error marking appointment as no-show: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve a ticket (mark as resolved)
     * POST /api/tickets/{ticketId}/resolve
     */
    public function resolveTicket(Request $request, $ticketId)
    {
        Log::info("🔧 Resolve ticket endpoint called", ['ticket_id' => $ticketId]);
        
        try {
            $validated = $request->validate([
                'resolution_notes' => 'required|string|max:1000',
                'evidence_base64' => 'nullable|string',
                'file_name' => 'required_with:evidence_base64|string|max:255',
                'file_type' => 'required_with:evidence_base64|string|in:image/jpeg,image/png,image/jpg,image/gif,video/mp4,video/mov,video/avi',
                'file_size' => 'required_with:evidence_base64|integer|max:10485760', // 10MB max
            ]);

            $ticket = Ticket::findOrFail($ticketId);
            
            // Verificar que el técnico autenticado sea el asignado o sea default/admin
            $user = $request->user();
            $technical = Technical::where('email', $user->email)->first();
            
            if (!$technical) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only technicians can resolve tickets'
                ], 403);
            }

            $isTechnicalDefault = $technical->is_default;
            $isAssignedTechnical = $ticket->technical_id === $technical->id;

            if (!$isTechnicalDefault && !$isAssignedTechnical) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only resolve tickets assigned to you'
                ], 403);
            }

            // Subir evidencia si se proporciona
            $evidenceUploaded = false;
            if (!empty($validated['evidence_base64'])) {
                $fileData = base64_decode($validated['evidence_base64']);
                
                if ($fileData !== false) {
                    $extension = match($validated['file_type']) {
                        'image/jpeg', 'image/jpg' => 'jpg',
                        'image/png' => 'png',
                        'image/gif' => 'gif',
                        'video/mp4' => 'mp4',
                        'video/mov' => 'mov',
                        'video/avi' => 'avi',
                        default => 'jpg'
                    };

                    $fileName = time() . '_' . uniqid() . '.' . $extension;
                    $filePath = 'ticket_evidence/' . $fileName;

                    \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory('ticket_evidence');
                    $saved = \Illuminate\Support\Facades\Storage::disk('public')->put($filePath, $fileData);
                    
                    if ($saved && \Illuminate\Support\Facades\Storage::disk('public')->exists($filePath)) {
                        // Agregar a attachments
                        $attachments = $ticket->attachments ?? [];
                        $attachments[] = [
                            'type' => 'evidence',
                            'file_path' => $filePath,
                            'name' => $fileName,
                            'original_name' => $validated['file_name'],
                            'mime_type' => $validated['file_type'],
                            'file_size' => $validated['file_size'],
                            'uploaded_by' => $technical->name,
                            'uploaded_at' => now()->toDateTimeString(),
                            'description' => 'Resolution evidence',
                            'upload_method' => 'base64_mobile'
                        ];
                        $ticket->attachments = $attachments;
                        $evidenceUploaded = true;
                    }
                }
            }

            // Cambiar estado a resolved
            $ticket->status = 'resolved';
            $ticket->resolved_at = now();
            $ticket->saveQuietly();

            // Agregar al historial
            $description = "Ticket resolved by {$technical->name}. Notes: " . $validated['resolution_notes'];
            if ($evidenceUploaded) {
                $description .= " (Evidence uploaded)";
            }

            $ticket->addHistory(
                'status_change_resolved',
                $description,
                ['resolution_notes' => $validated['resolution_notes'], 'evidence_uploaded' => $evidenceUploaded],
                $technical->id
            );

            Log::info("✅ Ticket resolved successfully", ['ticket_id' => $ticketId]);

            return response()->json([
                'success' => true,
                'message' => 'Ticket resolved successfully',
                'ticket' => [
                    'id' => $ticket->id,
                    'status' => $ticket->status,
                    'resolved_at' => $ticket->resolved_at,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("❌ Error resolving ticket", [
                'ticket_id' => $ticketId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error resolving ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a comment to a ticket
     * POST /api/tickets/{ticketId}/comment
     */
    public function addComment(Request $request, $ticketId)
    {
        Log::info("💬 Add comment endpoint called", ['ticket_id' => $ticketId]);
        
        try {
            $validated = $request->validate([
                'comment' => 'required|string|max:1000',
            ]);

            $ticket = Ticket::findOrFail($ticketId);
            
            // Verificar que el técnico autenticado sea el asignado o sea default/admin
            $user = $request->user();
            $technical = Technical::where('email', $user->email)->first();
            
            if (!$technical) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only technicians can add comments'
                ], 403);
            }

            $isTechnicalDefault = $technical->is_default;
            $isAssignedTechnical = $ticket->technical_id === $technical->id;

            if (!$isTechnicalDefault && !$isAssignedTechnical) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only comment on tickets assigned to you'
                ], 403);
            }

            // Agregar comentario al historial
            $description = "Comment by {$technical->name}: " . $validated['comment'];

            $ticket->addHistory(
                'comment',
                $description,
                ['comment' => $validated['comment']],
                $technical->id
            );

            Log::info("✅ Comment added successfully", ['ticket_id' => $ticketId]);

            return response()->json([
                'success' => true,
                'message' => 'Comment added successfully',
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("❌ Error adding comment", [
                'ticket_id' => $ticketId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error adding comment: ' . $e->getMessage()
            ], 500);
        }
    }
}
