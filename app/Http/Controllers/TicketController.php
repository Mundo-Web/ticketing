<?php

namespace App\Http\Controllers;

use App\Models\Technical;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Building;
use App\Models\Device;
use App\Models\Doorman;
use App\Models\Owner;
use App\Events\TicketCreated;
use App\Events\TicketAssigned;
use App\Events\TicketStatusChanged;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Listar tickets del usuario autenticado (o todos si es super-admin, o asignados si es technical)
        $user = Auth::user();
        $withRelations = [
            'technical',
            'device',
            'device.name_device',
            'device.brand',
            'device.model', 
            'device.system',
            'histories.technical',
            'user.tenant.apartment.building', // Para saber quién creó el ticket y su info
            'createdByOwner', // Relación con Owner que creó el ticket
            'createdByDoorman', // Relación con Doorman que creó el ticket
            'createdByAdmin', // Relación con Admin que creó el ticket
            'appointments', // Todas las citas del ticket
            'activeAppointment', // Cita activa actual
            'lastCompletedAppointment', // Última cita completada
        ];
        $ticketsQuery = Ticket::with($withRelations);
        $allTicketsQuery = Ticket::with($withRelations);
        $devicesOwn = collect();
        $devicesShared = collect();
        $allDevices = collect(); // Para admin y técnico default

                $isTechnicalDefault = false;
        $currentTechnicalId = null;
        
        if ($user->hasRole('super-admin')) {
            // Admin puede ver todos los dispositivos
            $allDevices = \App\Models\Device::with([
                'brand',
                'model',
                'system',
                'name_device'
            ])->get();
            // Ver todos los tickets
            // No filter
        } elseif ($user->hasRole('technical')) {
            // Buscar el técnico correspondiente al usuario autenticado por email
            $technical = Technical::where('email', $user->email)->first();
            if ($technical) {
                $currentTechnicalId = $technical->id;
                if ($technical->is_default) {
                    $isTechnicalDefault = true;
                    // Técnico por defecto: ve todos los tickets
                    // No filter
                } else {
                    // Técnico normal: solo tickets asignados a él
                    $ticketsQuery->where('technical_id', $technical->id);
                    $allTicketsQuery->where('technical_id', $technical->id);
                }
            } else {
                // Si no hay técnico asociado, no mostrar tickets
                $ticketsQuery->whereRaw('1 = 0');
                $allTicketsQuery->whereRaw('1 = 0');
            }
        } elseif ($user->hasRole('member')) {
            $member = Tenant::where('email', $user->email)->first();

            $devicesOwn = $member->devices;
            $devicesShared = $member->sharedDevices;
            $devicesOwn->load([
                'brand',
                'model',
                'system',
                'name_device',
                'sharedWith' => function ($query) {
                    $query->select('tenants.id', 'tenants.name', 'tenants.email', 'tenants.photo');
                },
                'tenants' => function ($query) {
                    $query->select('tenants.id', 'tenants.name', 'tenants.email', 'tenants.photo');
                }
            ]);
            $devicesShared->load([
                'brand',
                'model',
                'system',
                'name_device',
                'owner' => function ($query) {
                    $query->select('tenants.id', 'tenants.name', 'tenants.email', 'tenants.photo');
                }

            ]);
            // Ver solo tickets creados por el usuario
            $ticketsQuery->where('user_id', $user->id);
            $allTicketsQuery->where('user_id', $user->id);
        } else {
            // Otros roles, ver todos los tickets
            // No filter
        }

        // Crear query para todos los tickets sin filtro (siempre necesario)
        $allTicketsUnfilteredQuery = Ticket::with($withRelations);
        
                // Aplicar las mismas restricciones de usuario que a las queries principales
        if ($user->hasRole('super-admin')) {
            // Ver todos los tickets - no filtro
        } elseif ($user->hasRole('technical')) {
            $technical = Technical::where('email', $user->email)->first();
            if ($technical) {
                if ($technical->is_default) {
                    $isTechnicalDefault = true;
                    // Técnico por defecto: ve todos los tickets
                } else {
                    // Técnico normal: solo tickets asignados a él
                    $allTicketsUnfilteredQuery->where('technical_id', $technical->id);
                }
            } else {
                $allTicketsUnfilteredQuery->whereRaw('1 = 0');
            }
        } elseif ($user->hasRole('member')) {
            // Ver solo tickets creados por el usuario
            $allTicketsUnfilteredQuery->where('user_id', $user->id);
        }
        
        // Obtener todos los tickets sin filtro de estado
        $allTicketsUnfiltered = $allTicketsUnfilteredQuery->get();

        // Aplicar filtro de estado si se proporciona
        $statusFilter = $request->get('status');
        if ($statusFilter) {
            $statuses = explode(',', $statusFilter);
            $ticketsQuery->whereIn('status', $statuses);
            $allTicketsQuery->whereIn('status', $statuses);
        }

        $tickets = $ticketsQuery->latest()->paginate(10);
        $allTickets = $allTicketsQuery->latest()->get();
        $memberData = null;
        $apartmentData = null;
        $buildingData = null;
        
        // Cargar datos según el rol del usuario
        if ($user->hasRole('member')) {
            // Para MEMBERS: buscar en tabla tenants
            $memberData = Tenant::where('email', $user->email)->first();
            if ($memberData) {
                $apartmentData = $memberData->apartment;
                $buildingData = $apartmentData->building;
            }
        } elseif ($user->hasRole('owner')) {
            // Para OWNERS: buscar en tabla owners
            $owner = \App\Models\Owner::where('email', $user->email)->with('building')->first();
            if ($owner) {
                $buildingData = $owner->building;
                // Para owners, memberData y apartmentData pueden ser null
            }
        } elseif ($user->hasRole('doorman')) {
            // Para DOORMANS: buscar en tabla doormans
            $doorman = \App\Models\Doorman::where('email', $user->email)->with('building')->first();
            if ($doorman) {
                $buildingData = $doorman->building;
                // Para doorman, memberData y apartmentData pueden ser null
            }
        }

        // Datos adicionales para doorman y owner
        $allMembers = null;
        $allApartments = null;
        
        if ($user->hasRole('doorman') || $user->hasRole('owner')) {
            // Obtener el building del doorman/owner
            $userBuildingId = null;
            
            if ($user->hasRole('doorman')) {
                $doorman = \App\Models\Doorman::where('email', $user->email)->first();
                if ($doorman) {
                    $userBuildingId = $doorman->building_id;
                }
            } elseif ($user->hasRole('owner')) {
                $owner = \App\Models\Owner::where('email', $user->email)->first();
                if ($owner) {
                    $userBuildingId = $owner->building_id;
                }
            }
            
            if ($userBuildingId) {
                // Obtener solo los members/tenants del mismo building
                $allMembers = Tenant::with('apartment.building')
                    ->select('id', 'name', 'email', 'photo', 'apartment_id')
                    ->whereHas('apartment', function($query) use ($userBuildingId) {
                        $query->where('buildings_id', $userBuildingId);
                    })
                    ->get()
                    ->map(function ($tenant) {
                        return [
                            'id' => $tenant->id,
                            'name' => $tenant->name,
                            'email' => $tenant->email,
                            'photo' => $tenant->photo,
                            'apartment_name' => $tenant->apartment ? $tenant->apartment->name : 'N/A',
                            'tenant' => [
                                'id' => $tenant->id,
                                'name' => $tenant->name,
                                'email' => $tenant->email,
                                'photo' => $tenant->photo,
                                'apartment_id' => $tenant->apartment_id,
                            ]
                        ];
                    });

                // Obtener solo los apartments del mismo building
                $allApartments = \App\Models\Apartment::with('building:id,name')
                    ->select('id', 'name', 'ubicacion', 'buildings_id')
                    ->where('buildings_id', $userBuildingId)
                    ->get()
                    ->map(function ($apartment) {
                        return [
                            'id' => $apartment->id,
                            'name' => $apartment->name,
                            'floor' => $apartment->ubicacion,
                            'building' => $apartment->building ? [
                                'id' => $apartment->building->id,
                                'name' => $apartment->building->name,
                            ] : null,
                        ];
                    });

                // FILTRAR LOS TICKETS para mostrar solo del building correspondiente
                $ticketsQuery->whereHas('user.tenant.apartment', function($query) use ($userBuildingId) {
                    $query->where('buildings_id', $userBuildingId);
                });
                $allTicketsQuery->whereHas('user.tenant.apartment', function($query) use ($userBuildingId) {
                    $query->where('buildings_id', $userBuildingId);
                });
                // NO filtrar allTicketsUnfilteredQuery - debe contener todos los tickets para técnicos
            }
        }




        return Inertia::render('Tickets/index', [
            'tickets' => $tickets,
            'allTickets' => $allTickets,
            'allTicketsUnfiltered' => $allTicketsUnfiltered,
            'devicesOwn' => $devicesOwn,
            'devicesShared' => $devicesShared,
            'allDevices' => $allDevices, // Para admin y técnico default
            'memberData' => $memberData,
            'apartmentData' =>  $apartmentData,
            'buildingData' => $buildingData,
            'isTechnicalDefault' => $isTechnicalDefault,
            'isSuperAdmin' => $user->hasRole('super-admin'),
            'currentTechnicalId' => $currentTechnicalId, // Agregar el ID del técnico actual
            'statusFilter' => $statusFilter, // Pasar el filtro actual al frontend
            'allMembers' => $allMembers, // Para doorman y owner
            'allApartments' => $allApartments, // Para doorman y owner
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // No se usa, el formulario es modal en Devices
        abort(404);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'category' => 'required|string|max:100',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'member_id' => 'nullable|exists:tenants,id', // Para cuando owner/doorman crea por member
            'tenant_id' => 'nullable|exists:tenants,id', // Para cuando admin/technical crea por tenant
        ]);
        
        $user = Auth::user();
        $ticketData = [
            'device_id' => $validated['device_id'],
            'category' => $validated['category'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'status' => Ticket::STATUS_OPEN,
            'technical_id' => null, // Leave unassigned
        ];

        // Determinar quién es el usuario final del ticket y quién lo creó
        if ($request->has('member_id') && ($user->hasRole('owner') || $user->hasRole('doorman'))) {
            // Owner o Doorman creando ticket para un member
            $member = \App\Models\Tenant::findOrFail($validated['member_id']);
            $memberUser = \App\Models\User::where('email', $member->email)->first();
            
            if (!$memberUser) {
                return redirect()->back()->withErrors(['member_id' => 'Member user not found']);
            }
            
            $ticketData['user_id'] = $memberUser->id;
            
            // Registrar quién lo creó
            if ($user->hasRole('owner')) {
                $owner = \App\Models\Owner::where('email', $user->email)->first();
                if ($owner) {
                    $ticketData['created_by_owner_id'] = $owner->id;
                }
            } elseif ($user->hasRole('doorman')) {
                $doorman = \App\Models\Doorman::where('email', $user->email)->first();
                if ($doorman) {
                    $ticketData['created_by_doorman_id'] = $doorman->id;
                }
            }
        } elseif ($request->has('tenant_id') && ($user->hasRole('super-admin') || $user->hasRole('technical'))) {
            // Admin o Technical creando ticket para un tenant
            $tenant = \App\Models\Tenant::findOrFail($validated['tenant_id']);
            $tenantUser = \App\Models\User::where('email', $tenant->email)->first();
            
            if (!$tenantUser) {
                return redirect()->back()->withErrors(['tenant_id' => 'Tenant user not found']);
            }
            
            $ticketData['user_id'] = $tenantUser->id;
            
            // Registrar quién lo creó
            if ($user->hasRole('super-admin')) {
                $ticketData['created_by_admin_id'] = $user->id; // Usar el ID del admin directamente
            } elseif ($user->hasRole('technical')) {
                $technical = \App\Models\Technical::where('email', $user->email)->first();
                if ($technical) {
                    $ticketData['created_by_technical_id'] = $technical->id;
                }
            }
        } else {
            // Member creando su propio ticket
            $ticketData['user_id'] = $user->id;
        }
        
        // Create ticket
        $ticket = Ticket::create($ticketData);
        
        // Add initial history entry
        $userName = $user->name;
        
        // Try to get the user's name from tenant relationship if it's a member
        if ($user->hasRole('member')) {
            $tenant = \App\Models\Tenant::where('email', $user->email)->first();
            $userName = $tenant ? $tenant->name : $user->name;
        } elseif ($user->hasRole('owner')) {
            $owner = \App\Models\Owner::where('email', $user->email)->first();
            $userName = $owner ? $owner->name : $user->name;
        } elseif ($user->hasRole('doorman')) {
            $doorman = \App\Models\Doorman::where('email', $user->email)->first();
            $userName = $doorman ? $doorman->name : $user->name;
        }
        
        $historyDescription = "Ticket created by {$userName}";
        if ($request->has('member_id') && ($user->hasRole('owner') || $user->hasRole('doorman'))) {
            $member = \App\Models\Tenant::findOrFail($validated['member_id']);
            $historyDescription .= " on behalf of {$member->name}";
        }
        
        $ticket->addHistory(
            'created',
            $historyDescription,
            null,
            null
        );
        
        // Dispatch ticket created event
        event(new TicketCreated($ticket));
        
        return redirect()->back()->with('success', 'Ticket creado correctamente');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $ticket = Ticket::with([
            'technical',
            'device',
            'device.name_device',
            'device.brand',
            'device.model',
            'device.system',
            'histories.technical',
            'user.tenant.apartment.building', // Para saber quién creó el ticket y su info
            'createdByOwner', // Relación con Owner que creó el ticket
            'createdByDoorman', // Relación con Doorman que creó el ticket
            'createdByAdmin', // Relación con Admin que creó el ticket
            'appointments', // Todas las citas del ticket
            'activeAppointment', // Cita activa actual
            'lastCompletedAppointment', // Última cita completada
        ])->findOrFail($id);
        // Si es AJAX/fetch, devolver JSON
        if (request()->wantsJson() || request()->ajax()) {
            return response()->json(['ticket' => $ticket]);
        }
        // Si es navegación normal, render Inertia (opcional)
        return Inertia::render('Tickets/Show', [
            'ticket' => $ticket
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ticket $ticket)
    {
        // No se usa, edición desde panel admin
        abort(404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed,cancelled,reopened',
        ]);
        $ticket->status = $validated['status'];
        if ($ticket->status === Ticket::STATUS_RESOLVED) {
            $ticket->resolved_at = now();
        }
        if ($ticket->status === Ticket::STATUS_CLOSED) {
            $ticket->closed_at = now();
        }
        $ticket->save();
        // Agregar al historial
        $user = Auth::user();
        $technical = Technical::where('email', $user->email)->first();
        $technicalId = $technical ? $technical->id : null;
        
        // Get the technical's name for the description
        $actorName = $technical ? $technical->name : $user->name;
        
        $ticket->addHistory(
            'status_updated',
            "Status updated to {$ticket->status} by {$actorName}",
            null,
            $technicalId
        );
        return redirect()->back()->with('success', 'Estado del ticket actualizado');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $ticket = Ticket::findOrFail($id);
        
        // Solo admin puede eliminar tickets
        if (!$user->hasRole('super-admin')) {
            return back()->withErrors(['error' => 'Unauthorized to delete tickets']);
        }
        
        // Eliminar el ticket y sus dependencias
        $ticket->histories()->delete(); // Eliminar historial
        $ticket->delete();
        
        // Redirect back with success message
        return redirect()->back()->with('success', 'Ticket deleted successfully');
    }

    /**
     * Add member comment/feedback to a ticket (only visible to admins)
     */
    public function addMemberFeedback(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'comment' => 'nullable|string|max:1000',
            'rating' => 'required|integer|min:1|max:5',
            'is_feedback' => 'boolean',
        ]);

        $user = Auth::user();
        
        // Only allow ticket owner (member) to add feedback
        if ($ticket->user_id !== $user->id) {
            abort(403, 'You can only add feedback to your own tickets');
        }

        // Prepare feedback data
        $feedbackData = [
            'comment' => $validated['comment'] ?? '',
            'rating' => $validated['rating'],
            'from_member' => true
        ];

        // Add feedback as internal comment (only visible to admins)
        $ticket->addHistory(
            $validated['is_feedback'] ? 'member_feedback' : 'member_comment',
            $validated['comment'] ? $validated['comment'] : "Calificación: {$validated['rating']} estrellas",
            $feedbackData,
            null // No technical_id for member feedback
        );

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Your feedback has been submitted successfully',
                'ticket' => $ticket->fresh(['histories.technical'])
            ]);
        }

        return redirect()->back()->with('success', 'Your feedback has been submitted successfully');
    }

    /**
     * Listar técnicos para asignación/derivación (AJAX)
     */
    public function technicalsList()
    {
        $technicals = \App\Models\Technical::select('id', 'name', 'email', 'shift', 'photo')->get();
        return response()->json(['technicals' => $technicals]);
    }
    /**
     * Asignar o derivar técnico a un ticket
     */
    public function assignTechnical(Request $request, Ticket $ticket)
    {
        try {
            $validated = $request->validate([
                'technical_id' => 'required|exists:technicals,id',
                'comment' => 'nullable|string|max:1000',
            ]);
            
            $oldTechnical = $ticket->technical_id;
            $newTechnical = Technical::findOrFail($validated['technical_id']);
            
            // Verificar que el ticket no esté ya asignado al mismo técnico
            if ($ticket->technical_id == $validated['technical_id']) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->with('error', 'Ticket is already assigned to this technician');
                }
                if ($request->expectsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ticket is already assigned to this technician'
                    ], 400);
                }
                return redirect()->back()->with('error', 'Ticket is already assigned to this technician');
            }
            
            $ticket->technical_id = $validated['technical_id'];
            $ticket->save();

            // Get who is performing the assignment
            $user = Auth::user();
            $assignerTechnical = Technical::where('email', $user->email)->first();
            $assignerName = $assignerTechnical ? $assignerTechnical->name : $user->name;

            $description = $validated['comment'] ?? "Ticket assigned to {$newTechnical->name} by {$assignerName}";
            
            $ticket->addHistory(
                'assigned_technical',
                $description,
                [
                    'from' => $oldTechnical,
                    'to' => $validated['technical_id']
                ],
                $validated['technical_id']
            );
            
            // Dispatch ticket assigned event
            event(new TicketAssigned($ticket, $newTechnical, $user));
            
            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                // For Inertia requests, redirect back with success message
                return redirect()->back()->with('success', 'Technician assigned successfully');
            }
            
            // For AJAX/fetch requests (not Inertia), return JSON
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Technician assigned successfully',
                    'ticket' => $ticket->load([
                        'technical', 
                        'user.tenant', 
                        'device.tenants',
                        'createdByOwner',
                        'createdByDoorman'
                    ]),
                    'technical' => $newTechnical
                ]);
            }
            
            // Para formularios tradicionales, redirigir
            return redirect()->back()->with('success', 'Technician assigned');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->header('X-Inertia')) {
                throw $e; // Let Inertia handle validation errors normally
            }
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error assigning technician: ' . $e->getMessage());
            
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', 'An error occurred while assigning technician');
            }
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An error occurred while assigning technician'
                ], 500);
            }
            return redirect()->back()->with('error', 'An error occurred while assigning technician');
        }
    }

    /**
     * Agregar acción/comentario al historial
     */
    public function addHistory(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'action' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'meta' => 'nullable|array',
        ]);

        // Obtener el usuario autenticado
        $user = Auth::user();
        // Buscar el técnico correspondiente al usuario autenticado por email
        $technical = Technical::where('email', $user->email)->first();
        $technicalId = $technical ? $technical->id : null;

        // Get actor name for better history description
        $actorName = $technical ? $technical->name : $user->name;
        $description = $validated['description'] ?? "Action performed by {$actorName}";

        $ticket->addHistory(
            $validated['action'],
            $description,
            $validated['meta'] ?? null,
            $technicalId
        );
        
        // Check if this is an Inertia request
        if ($request->header('X-Inertia')) {
            // For Inertia requests, redirect back with success message
            return redirect()->back()->with('success', 'History added');
        }
        
        // For AJAX/fetch requests (not Inertia), return JSON
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'History added successfully',
                'ticket' => $ticket->fresh(['histories.technical', 'user.tenant', 'device.tenants'])
            ]);
        }
        
        // SIEMPRE redirige (no devuelvas JSON)
        return redirect()->back()->with('success', 'History added');
    }

        /**
     * Actualizar solo el estado del ticket (para Kanban drag & drop)
     */
    public function updateStatus(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'status' => 'required|string|max:50',
        ]);

        $ticket->status = $validated['status'];
        $ticket->save();

        // Get user info for better history
        $user = Auth::user();
        $technical = Technical::where('email', $user->email)->first();
        $actorName = $technical ? $technical->name : $user->name;

        // Opcional: agrega historial de cambio de estado
        $ticket->addHistory(
            'status_updated',
            "Status updated to {$validated['status']} by {$actorName}",
            null,
            $technical ? $technical->id : null
        );

        // Para peticiones AJAX/JSON
        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        // Para Inertia
        return redirect()->back()->with('success', 'Status updated');
    }

    /**
     * Mostrar página para asignar tickets sin asignar
     */
    
    public function assignToTechnical(Request $request, $ticketId)
    {
        $user = Auth::user();
        
        // Verificar que sea super-admin o técnico por defecto
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            return redirect()->back()->withErrors(['error' => 'No tienes permisos para asignar tickets']);
        }
        
        $validated = $request->validate([
            'technical_id' => 'required|exists:technicals,id',
        ]);
        
        $ticket = Ticket::findOrFail($ticketId);
        $technical = Technical::findOrFail($validated['technical_id']);
        
        // Asignar el ticket
        $ticket->update([
            'technical_id' => $technical->id,
            'status' => 'in_progress'
        ]);
        
        // Get who is performing the assignment
        $assignerName = $user->name;
        if ($user->hasRole('technical')) {
            $assignerTechnical = Technical::where('email', $user->email)->first();
            $assignerName = $assignerTechnical ? $assignerTechnical->name : $user->name;
        }
        
        // Agregar entrada al historial
        $ticket->addHistory(
            'assigned_technical',
            "Ticket assigned to {$technical->name} by {$assignerName}",
            ['to' => $technical->id],
            $user->hasRole('technical') ? Technical::where('email', $user->email)->first()?->id : null
        );
        
        return redirect()->back()->with('success', 'Ticket assigned successfully');
    }

    /**
     * Upload evidence (photo/video) to a ticket
     */
    public function uploadEvidence(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'evidence' => 'required|file|mimes:jpg,jpeg,png,gif,mp4,mov,avi|max:10240', // 10MB max
            'description' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        
        // Verificar permisos: solo el técnico asignado, técnico default o admin pueden subir evidencia
        $technical = Technical::where('email', $user->email)->first();
        $isTechnicalDefault = $technical && $technical->is_default;
        $isSuperAdmin = $user->hasRole('super-admin');
        $isAssignedTechnical = $ticket->technical_id === $technical?->id;

        if (!$isSuperAdmin && !$isTechnicalDefault && !$isAssignedTechnical) {
            abort(403, 'You can only upload evidence to tickets assigned to you.');
        }

        // Guardar el archivo
        $file = $request->file('evidence');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('ticket_evidence', $fileName, 'public');

        // Agregar al historial con metadata del archivo
        $actorName = $technical ? $technical->name : $user->name;
        $description = $validated['description'] 
            ? "Evidence uploaded by {$actorName}: " . $validated['description']
            : "Evidence uploaded by {$actorName}";

        $ticket->addHistory(
            'evidence_uploaded',
            $description,
            [
                'file_path' => $filePath,
                'file_name' => $fileName,
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'original_name' => $file->getClientOriginalName()
            ],
            $technical?->id
        );

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Evidence uploaded successfully',
                'file_path' => $filePath,
                'file_name' => $fileName
            ]);
        }

        return redirect()->back()->with('success', 'Evidence uploaded successfully');
    }

    /**
     * Add private note (only visible to technicians)
     */
    public function addPrivateNote(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'note' => 'required|string|max:1000',
        ]);

        $user = Auth::user();
        
        // Solo técnicos pueden agregar notas privadas
        $technical = Technical::where('email', $user->email)->first();
        $isSuperAdmin = $user->hasRole('super-admin');

        if (!$technical && !$isSuperAdmin) {
            abort(403, 'Only technicians can add private notes.');
        }

        // Agregar al historial como nota privada
        $actorName = $technical ? $technical->name : $user->name;
        $description = "Private note by {$actorName}: " . $validated['note'];

        $ticket->addHistory(
            'private_note',
            $description,
            [
                'is_private' => true,
                'note_content' => $validated['note']
            ],
            $technical?->id
        );

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Private note added successfully'
            ]);
        }

        return redirect()->back()->with('success', 'Private note added successfully');
    }

    public function assignUnassigned()
    {
        $user = Auth::user();
        
        // Verificar que sea super-admin o técnico por defecto
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'No tienes permisos para acceder a esta página');
        }
        
        // Obtener tickets sin asignar
        $unassignedTickets = Ticket::with([
            'device.name_device',
            'user.tenant.apartment.building'
        ])->whereNull('technical_id')->get();
        
        // Obtener técnicos disponibles
        $technicals = Technical::where('status', true)->get();
        
        return Inertia::render('Tickets/AssignUnassigned', [
            'unassignedTickets' => $unassignedTickets,
            'technicals' => $technicals,
        ]);
    }
}
