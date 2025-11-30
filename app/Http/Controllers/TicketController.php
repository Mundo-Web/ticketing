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
use App\Events\NotificationCreated;
use App\Notifications\TicketCreatedNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
            'device.tenants.apartment.building', // Device relationships to get building/apartment info
            'device.name_device',
            'device.brand',
            'device.model', 
            'device.system',
            'histories.technical',
            'user.tenant.apartment.building', // Para saber quién creó el ticket y su info
            'createdByOwner', // Relación con Owner que creó el ticket
            'createdByDoorman', // Relación con Doorman que creó el ticket
            'createdByAdmin', // Relación con Admin que creó el ticket
            'appointments.technical', // Todas las citas del ticket con técnico
            'activeAppointment.technical', // Cita activa actual con técnico
            'activeAppointment.ticket.device.tenants.apartment.building', // Full ticket relationship for active appointment
            'activeAppointment.ticket.user.tenant.apartment.building', // Full user relationship for active appointment
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
            'googleMapsApiKey' => env('GMAPS_API_KEY'),
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
            'attachments.*' => 'nullable|file|mimes:jpeg,png,jpg,gif,webp,mp4,webm,ogg,avi,mov|max:10240', // 10MB max per file
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

        // Handle file attachments
        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                $fileName = uniqid() . '_' . time() . '.' . $extension;
                
                // Store file in public/storage/tickets
                $path = $file->storeAs('tickets', $fileName, 'public');
                
                $attachments[] = [
                    'original_name' => $originalName,
                    'file_name' => $fileName,
                    'file_path' => $path,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'uploaded_at' => now()->toISOString(),
                ];
            }
        }
        
        $ticketData['attachments'] = $attachments;

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
        
        // Send notifications directly to admins and default technicals
        try {
            // 1. Notificar a todos los super-admins
            $admins = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['super-admin']);
            })->get();

            foreach ($admins as $admin) {
                $notification = $admin->notify(new \App\Notifications\TicketCreatedNotification($ticket));
                
                // Emit real-time notification event
                $databaseNotification = $admin->notifications()->latest()->first();
                if ($databaseNotification) {
                    event(new \App\Events\NotificationCreated($databaseNotification, $admin->id));
                }
                
                Log::info('Notification sent to super-admin', [
                    'admin_id' => $admin->id,
                    'admin_name' => $admin->name,
                    'ticket_id' => $ticket->id,
                    'ticket_code' => $ticket->code
                ]);
            }

            // 2. Notificar a técnicos default (is_default = true)
            $defaultTechnicals = User::whereHas('roles', function ($query) {
                $query->where('name', 'technical');
            })->whereHas('technical', function ($query) {
                $query->where('is_default', true);
            })->get();

            foreach ($defaultTechnicals as $technical) {
                $notification = $technical->notify(new \App\Notifications\TicketCreatedNotification($ticket));
                
                // Emit real-time notification event
                $databaseNotification = $technical->notifications()->latest()->first();
                if ($databaseNotification) {
                    event(new \App\Events\NotificationCreated($databaseNotification, $technical->id));
                }
                
                Log::info('Notification sent to technical-default', [
                    'technical_id' => $technical->id,
                    'technical_name' => $technical->name,
                    'ticket_id' => $ticket->id,
                    'ticket_code' => $ticket->code
                ]);
            }

            Log::info('All ticket creation notifications sent successfully', [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'super_admins_notified' => $admins->count(),
                'technical_defaults_notified' => $defaultTechnicals->count(),
                'total_notifications' => $admins->count() + $defaultTechnicals->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error sending ticket creation notifications', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // No interrumpir el flujo si las notificaciones fallan
        }
        
        return redirect()->back()->with('success', 'Ticket creado correctamente');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $ticket = Ticket::with([
            'technical',
            'device.tenants.apartment.building', // Device relationships to get building/apartment info
            'device.name_device',
            'device.brand',
            'device.model',
            'device.system',
            'histories.technical',
            'user.tenant.apartment.building', // Para saber quién creó el ticket y su info
            'createdByOwner', // Relación con Owner que creó el ticket
            'createdByDoorman', // Relación con Doorman que creó el ticket
            'createdByAdmin', // Relación con Admin que creó el ticket
            'appointments.technical', // Todas las citas del ticket con técnico
            'activeAppointment.technical', // Cita activa actual con técnico
            'activeAppointment.ticket.device.tenants.apartment.building', // Full ticket relationship for active appointment
            'activeAppointment.ticket.user.tenant.apartment.building', // Full user relationship for active appointment
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
        
        // Guardar el estado anterior para las notificaciones
        $oldStatus = $ticket->status;
        
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

        // Enviar notificaciones de cambio de estado
        if ($oldStatus !== $ticket->status) {
            $notificationService = new \App\Services\NotificationDispatcherService();
            $notificationService->dispatchTicketStatusChanged($ticket, $oldStatus, $ticket->status, $user);
        }

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
            
            // Dispatch ticket assigned event (commented out to avoid duplicate notifications)
            // event(new TicketAssigned($ticket, $newTechnical, $user));
            
            // Send notifications using NotificationDispatcherService (single point of notification)
            try {
                $notificationService = new \App\Services\NotificationDispatcherService();
                $notificationService->dispatchTicketAssigned($ticket, $newTechnical, $user);
                
                Log::info('Ticket assignment notification dispatched via NotificationDispatcherService', [
                    'ticket_id' => $ticket->id,
                    'ticket_code' => $ticket->code,
                    'technical_assigned' => $newTechnical->name,
                    'assigned_by' => $user->name
                ]);

            } catch (\Exception $e) {
                Log::error('Error sending ticket assignment notifications', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                // No interrumpir el flujo si las notificaciones fallan
            }
            
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

    public function unassignTechnical(Request $request, Ticket $ticket)
    {
        try {
            // Verificar que el ticket tenga un técnico asignado
            if (!$ticket->technical_id) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->with('error', 'Ticket is not assigned to any technician');
                }
                if ($request->expectsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ticket is not assigned to any technician'
                    ], 400);
                }
                return redirect()->back()->with('error', 'Ticket is not assigned to any technician');
            }
            
            $oldTechnical = $ticket->technical;
            $user = Auth::user();
            $assignerTechnical = Technical::where('email', $user->email)->first();
            $assignerName = $assignerTechnical ? $assignerTechnical->name : $user->name;
            
            // Desasignar el técnico
            $ticket->technical_id = null;
            $ticket->save();

            $description = "Technician {$oldTechnical->name} unassigned by {$assignerName}";
            
            $ticket->addHistory(
                'unassigned_technical',
                $description,
                [
                    'from' => $oldTechnical->id,
                    'to' => null
                ],
                null
            );
            
            // Check if this is an Inertia request
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Technician unassigned successfully');
            }
            
            // For AJAX/fetch requests (not Inertia), return JSON
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Technician unassigned successfully',
                    'ticket' => $ticket->load([
                        'technical', 
                        'user.tenant', 
                        'device.tenants',
                        'createdByOwner',
                        'createdByDoorman'
                    ])
                ]);
            }
            
            // Para formularios tradicionales, redirigir
            return redirect()->back()->with('success', 'Technician unassigned');
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error unassigning technician: ' . $e->getMessage());
            
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', 'An error occurred while unassigning technician');
            }
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'An error occurred while unassigning technician'
                ], 500);
            }
            return redirect()->back()->with('error', 'An error occurred while unassigning technician');
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

        // Disparar notificación de comentario si es un comentario
        if ($validated['action'] === 'comment' && !empty($description)) {
            try {
                // Recargar el ticket con todas las relaciones necesarias
                $ticketWithRelations = Ticket::with([
                    'user.tenant.apartment.building',
                    'device.name_device',
                    'device.brand',
                    'device.model',
                    'technical'
                ])->find($ticket->id);
                
                $notificationService = new \App\Services\NotificationDispatcherService();
                $notificationService->dispatchTicketCommentAdded($ticketWithRelations, $description, $user);
                
                Log::info('Comment notification dispatched successfully', [
                    'ticket_id' => $ticket->id,
                    'comment_by' => $user->id,
                    'comment' => substr($description, 0, 100)
                ]);
            } catch (\Exception $e) {
                Log::error('Error sending comment notification', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                // No interrumpir el flujo si la notificación falla
            }
        }

        // Emitir evento socket si corresponde
        if (
            $request->has('broadcastNotification') &&
            $request->broadcastNotification &&
            $validated['action'] === 'status_change_resolved'
        ) {
            broadcast(new \App\Events\TicketStatusChanged(
                $ticket,
                $ticket->status, // oldStatus (puedes guardar el anterior si lo necesitas)
                'resolved',      // newStatus
                $user
            ));
        }

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

        // Guardar el estado anterior para las notificaciones
        $oldStatus = $ticket->status;

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

        // Enviar notificaciones de cambio de estado
        if ($oldStatus !== $ticket->status) {
            $notificationService = new \App\Services\NotificationDispatcherService();
            $notificationService->dispatchTicketStatusChanged($ticket, $oldStatus, $ticket->status, $user);
        }

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
        
        // Send notifications using NotificationDispatcherService (single point of notification)
        try {
            $notificationService = new \App\Services\NotificationDispatcherService();
            $notificationService->dispatchTicketAssigned($ticket, $technical, $user);
            
            Log::info('Ticket assignment notification dispatched via NotificationDispatcherService (assignToTechnical)', [
                'ticket_id' => $ticket->id,
                'ticket_code' => $ticket->code,
                'technical_assigned' => $technical->name,
                'assigned_by' => $user->name
            ]);

        } catch (\Exception $e) {
            Log::error('Error sending ticket assignment notifications (assignToTechnical)', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            // No interrumpir el flujo si las notificaciones fallan
        }
        
        return redirect()->back()->with('success', 'Ticket assigned successfully');
    }

    /**
     * Upload evidence (photo/video) to a ticket
     */
    public function uploadEvidence(Request $request, Ticket $ticket)
    {
        try {
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
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You can only upload evidence to tickets assigned to you.'
                    ], 403);
                }
                abort(403, 'You can only upload evidence to tickets assigned to you.');
            }

            // Guardar el archivo
            $file = $request->file('evidence');
            $fileName = time() . '_' . $file->getClientOriginalName();
            
            // Asegurarse de que el directorio existe
            $directory = 'ticket_evidence';
            Storage::disk('public')->makeDirectory($directory);
            
            // Intentar guardar el archivo
            $filePath = $file->storeAs($directory, $fileName, 'public');
            
            // LOG INMEDIATO para debug
            Log::info('UPLOAD DEBUG', [
                'filePath_result' => $filePath,
                'filePath_type' => gettype($filePath),
                'filePath_is_false' => $filePath === false,
                'storage_path' => Storage::disk('public')->path($directory),
                'directory_exists' => is_dir(Storage::disk('public')->path($directory)),
                'directory_writable' => is_writable(Storage::disk('public')->path($directory)),
            ]);
            
            // Verificar que el archivo se guardó correctamente
            if ($filePath === false || !$filePath || !Storage::disk('public')->exists($filePath)) {
                Log::error('UPLOAD FAILED', [
                    'filePath' => $filePath,
                    'directory' => Storage::disk('public')->path($directory),
                    'file_name' => $fileName,
                ]);
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to save file to storage. Directory may not be writable.',
                        'debug' => [
                            'storage_path' => Storage::disk('public')->path($directory),
                            'directory_exists' => is_dir(Storage::disk('public')->path($directory)),
                            'directory_writable' => is_writable(Storage::disk('public')->path($directory)),
                        ]
                    ], 500);
                }
                throw new \Exception('Failed to save file to storage');
            }

            // Actualizar el campo attachments del ticket
            $attachments = $ticket->attachments ?? [];
            
            $newAttachment = [
                'type' => 'evidence',
                'file_path' => $filePath,
                'name' => $fileName,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => $user->name,
                'uploaded_at' => now()->toDateTimeString(),
                'description' => $validated['description'] ?? null
            ];
            
            $attachments[] = $newAttachment;
            
            // Actualizar attachments sin disparar eventos de auditoría
            $ticket->attachments = $attachments;
            
            try {
                // saveQuietly() no dispara eventos, evitando problemas con Auditable
                $ticket->saveQuietly();
            } catch (\Exception $saveException) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Error saving ticket: ' . $saveException->getMessage()
                    ], 500);
                }
                throw $saveException;
            }

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
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error uploading evidence', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error uploading evidence: ' . $e->getMessage()
                ], 500);
            }
            throw $e;
        }
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

    /**
     * Upload evidence with base64 (for mobile Android)
     */
    public function uploadEvidenceBase64(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'evidence_base64' => 'required|string',
            'file_name' => 'required|string|max:255',
            'file_type' => 'required|string|in:image/jpeg,image/png,image/jpg,image/gif,video/mp4,video/mov,video/avi',
            'file_size' => 'required|integer|max:10485760', // 10MB max
            'description' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        
        // Verificar permisos: solo el técnico asignado, técnico default o admin pueden subir evidencia
        $technical = Technical::where('email', $user->email)->first();
        $isTechnicalDefault = $technical && $technical->is_default;
        $isSuperAdmin = $user->hasRole('super-admin');
        $isAssignedTechnical = $ticket->technical_id === $technical?->id;

        if (!$isSuperAdmin && !$isTechnicalDefault && !$isAssignedTechnical) {
            return response()->json([
                'success' => false,
                'message' => 'You can only upload evidence to tickets assigned to you.'
            ], 403);
        }

        try {
            // Decode base64
            $fileData = base64_decode($validated['evidence_base64']);
            
            if ($fileData === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid base64 data'
                ], 400);
            }

            // Generar nombre único
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

            // Asegurarse de que el directorio existe
            Storage::disk('public')->makeDirectory('ticket_evidence');

            // Guardar archivo
            $saved = Storage::disk('public')->put($filePath, $fileData);
            
            if (!$saved) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save file to storage'
                ], 500);
            }
            
            // Verificar que el archivo existe
            if (!Storage::disk('public')->exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File saved but not found. Storage may not be configured correctly.'
                ], 500);
            }

            // Actualizar el campo attachments del ticket
            $attachments = $ticket->attachments ?? [];
            
            $newAttachment = [
                'type' => 'evidence',
                'file_path' => $filePath,
                'name' => $fileName,
                'original_name' => $validated['file_name'],
                'mime_type' => $validated['file_type'],
                'file_size' => $validated['file_size'],
                'uploaded_by' => $user->name,
                'uploaded_at' => now()->toDateTimeString(),
                'description' => $validated['description'] ?? null,
                'upload_method' => 'base64_mobile'
            ];
            
            $attachments[] = $newAttachment;
            
            // Actualizar attachments sin disparar eventos de auditoría
            $ticket->attachments = $attachments;
            
            try {
                // saveQuietly() no dispara eventos, evitando problemas con Auditable
                $ticket->saveQuietly();
            } catch (\Exception $saveException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error saving ticket: ' . $saveException->getMessage()
                ], 500);
            }

            // Agregar al historial
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
                    'file_type' => $validated['file_type'],
                    'file_size' => $validated['file_size'],
                    'original_name' => $validated['file_name'],
                    'upload_method' => 'base64_mobile'
                ],
                $technical?->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Evidence uploaded successfully',
                'file_path' => $filePath,
                'file_name' => $fileName,
                'file_url' => asset('storage/' . $filePath)
            ]);

        } catch (\Exception $e) {
            Log::error('Error uploading evidence base64', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error uploading evidence: ' . $e->getMessage()
            ], 500);
        }
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
    
    /**
     * API endpoint for fetching tickets by status
     * Used by the dashboard cards to display tickets in modals
     */
    public function apiTickets(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }
            
            $status = $request->get('status');
            
            // Base query for tickets with necessary relations
            $ticketsQuery = Ticket::with([
                'technical',
                'device',
                'device.name_device',
                'device.brand',
                'device.model', 
                'device.system',
                'histories.technical',
                'user.tenant.apartment.building',
                'createdByOwner',
                'createdByDoorman',
                'createdByAdmin',
            ]);
            
            // Apply status filter if provided
            if ($status) {
                $ticketsQuery->where('status', $status);
            }
            
            // Apply user role filtering
            if ($user->hasRole('super-admin')) {
                // Admin can see all tickets
                // No additional filter needed
            } elseif ($user->hasRole('technical')) {
                // Technical can only see assigned tickets
                $technical = Technical::where('email', $user->email)->first();
                if ($technical) {
                    if ($technical->is_default) {
                        // Default technical can see all tickets
                        // No additional filter needed
                    } else {
                        // Regular technical can only see assigned tickets
                        $ticketsQuery->where('technical_id', $technical->id);
                    }
                } else {
                    $ticketsQuery->whereRaw('1 = 0'); // No tickets if no technical found
                }
            } elseif ($user->hasRole('member')) {
                // Member can only see their own tickets
                $ticketsQuery->where('user_id', $user->id);
            } elseif ($user->hasRole('owner') || $user->hasRole('doorman')) {
                // Owner/Doorman can see tickets from their building
                $buildingId = null;
                
                if ($user->hasRole('owner')) {
                    $owner = \App\Models\Owner::where('email', $user->email)->first();
                    if ($owner) {
                        $buildingId = $owner->building_id;
                    }
                } elseif ($user->hasRole('doorman')) {
                    $doorman = \App\Models\Doorman::where('email', $user->email)->first();
                    if ($doorman) {
                        $buildingId = $doorman->building_id;
                    }
                }
                
                if ($buildingId) {
                    $ticketsQuery->whereHas('user.tenant.apartment', function($query) use ($buildingId) {
                        $query->where('buildings_id', $buildingId);
                    });
                } else {
                    $ticketsQuery->whereRaw('1 = 0'); // No tickets if no building found
                }
            }
            
            // Get tickets and return as JSON
            $tickets = $ticketsQuery->latest()->get();
            
            return response()->json([
                'tickets' => $tickets,
                'status' => $status,
                'user_roles' => $user->roles->pluck('name')->toArray(),
                'count' => $tickets->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('API Tickets Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API endpoint for fetching technical-specific tickets
     * Used by technical users for their specific metrics
     */
    public function apiTechnicalTickets(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['error' => 'User not authenticated'], 401);
            }

            if (!$user->hasRole('technical')) {
                return response()->json(['error' => 'Access denied. Technical role required.'], 403);
            }

            $type = $request->get('type'); // 'today' or 'urgent'
            
            // Get technical user
            $technical = Technical::where('email', $user->email)->first();
            if (!$technical) {
                return response()->json(['error' => 'Technical profile not found'], 404);
            }

            // Base query for technical's assigned tickets
            $ticketsQuery = Ticket::with([
                'technical',
                'device',
                'device.name_device',
                'device.brand',
                'device.model', 
                'device.system',
                'histories.technical',
                'user.tenant.apartment.building',
                'createdByOwner',
                'createdByDoorman',
                'createdByAdmin',
            ]);

            // For regular technicals, only show assigned tickets
            if (!$technical->is_default) {
                $ticketsQuery->where('technical_id', $technical->id);
            }

            // Apply type-specific filters
            if ($type === 'today') {
                // Today's assigned tickets - show active tickets for the technical
                $ticketsQuery->whereIn('status', ['open', 'in_progress']);
                
                // If not default technical, only show their assigned tickets
                if (!$technical->is_default) {
                    // For regular technicals, show their assigned tickets that are active
                    $ticketsQuery->where('technical_id', $technical->id);
                } else {
                    // For default technicals, show recent unassigned or their assigned tickets
                    $ticketsQuery->where(function($query) use ($technical) {
                        $query->where('technical_id', $technical->id)
                              ->orWhereNull('technical_id');
                    });
                }
            } elseif ($type === 'urgent') {
                // Urgent tickets - tickets assigned today or old unresolved tickets
                $ticketsQuery->where(function($query) {
                    $query->whereDate('created_at', today()) // Tickets created today
                          ->orWhere(function($subQuery) {
                              // Also include tickets older than 24 hours without resolution
                              $subQuery->whereIn('status', ['open', 'in_progress'])
                                      ->where('created_at', '<=', now()->subHours(24));
                          })
                          ->orWhere('category', 'like', '%Emergency%') // Emergency categories
                          ->orWhere('category', 'like', '%Critical%')  // Critical categories
                          ->orWhere('category', 'like', '%Urgent%');   // Urgent categories
                })->whereIn('status', ['open', 'in_progress']);
            }

            // Get tickets
            $tickets = $ticketsQuery->latest()->get();

            return response()->json([
                'tickets' => $tickets,
                'type' => $type,
                'technical_id' => $technical->id,
                'is_default_technical' => $technical->is_default,
                'count' => $tickets->count()
            ]);

        } catch (\Exception $e) {
            Log::error('API Technical Tickets Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send message to assigned technician
     */
    public function sendMessageToTechnical(Request $request, Ticket $ticket)
    {
        try {
            $request->validate([
                'message' => 'required|string|max:500'
            ]);

            $user = Auth::user();
            
            // Cargar relaciones necesarias
            $user->load('tenant.apartment.building');
            
            // Verificar que el usuario es miembro y es el propietario del ticket
            if (!$user || !$user->hasRole('member') || $ticket->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized to send message for this ticket'
                ], 403);
            }

            // Verificar que el ticket tiene un técnico asignado
            if (!$ticket->technical_id) {
                Log::warning("No technician assigned to ticket", [
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id
                ]);
                return response()->json([
                    'message' => 'No technician assigned to this ticket'
                ], 400);
            }

            // Crear entrada en el historial del ticket
            $ticket->histories()->create([
                'action' => 'member_message',
                'description' => $request->message,
                'user_id' => $user->id,
                'technical_id' => null, // El mensaje viene del member
                'created_at' => now(),
            ]);

            // Obtener el técnico asignado para la notificación
            $technical = $ticket->technical;
            
            if ($technical) {
                // Buscar el usuario del técnico usando el mismo patrón que assignTechnical
                $technicalUser = User::where('email', $technical->email)->first();
                
                if ($technicalUser) {
                    // Crear notificación para el técnico
                    $technicalUser->notify(new \App\Notifications\MemberMessageNotification(
                        $ticket,
                        $user->tenant,
                        $request->message
                    ));
                    
                    // Emit real-time notification event (igual que en assign)
                    $databaseNotification = $technicalUser->notifications()->latest()->first();
                    if ($databaseNotification) {
                        event(new \App\Events\NotificationCreated($databaseNotification, $technicalUser->id));
                    }
                    
                    Log::info("Member message notification sent to technical", [
                        'technical_id' => $technical->id,
                        'technical_email' => $technical->email,
                        'technical_user_id' => $technicalUser->id,
                        'technical_user_email' => $technicalUser->email,
                        'ticket_id' => $ticket->id,
                        'member_id' => $user->id,
                        'member_name' => $user->name
                    ]);
                } else {
                    Log::warning("Technical user not found by email", [
                        'technical_id' => $technical->id,
                        'technical_email' => $technical->email,
                        'ticket_id' => $ticket->id
                    ]);
                }
            } else {
                Log::warning("Technical not found for ticket", [
                    'ticket_id' => $ticket->id,
                    'technical_id' => $ticket->technical_id
                ]);
            }

            // Log the action
            Log::info("Member message sent", [
                'ticket_id' => $ticket->id,
                'member_id' => $user->id,
                'technical_id' => $ticket->technical_id,
                'message_length' => strlen($request->message)
            ]);

            return response()->json([
                'message' => 'Message sent successfully',
                'ticket_id' => $ticket->id
            ]);

        } catch (\Exception $e) {
            Log::error('Send Message to Technical Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to send message',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
