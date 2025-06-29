<?php

namespace App\Http\Controllers;

use App\Models\Technical;
use App\Models\Tenant;
use App\Models\Ticket;
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
        $user = auth()->user();
        $withRelations = [
            'technical',
            'device',
            'device.name_device',
            'device.brand',
            'device.model', 
            'device.system',
            'histories.technical',
            'user.tenant.apartment.building', // Para saber quién creó el ticket y su info
        ];
        $ticketsQuery = Ticket::with($withRelations);
        $allTicketsQuery = Ticket::with($withRelations);
        $devicesOwn = collect();
        $devicesShared = collect();

        $isTechnicalDefault = false;
        if ($user->hasRole('super-admin')) {
            // Ver todos los tickets
            // No filter
        } elseif ($user->hasRole('technical')) {
            // Buscar el técnico correspondiente al usuario autenticado por email
            $technical = Technical::where('email', $user->email)->first();
            if ($technical) {
                if ($technical->is_default) {
                    // Jefe técnico: puede ver todos los tickets
                    $isTechnicalDefault = true;
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
                if (!$technical->is_default) {
                    // Técnico normal: solo tickets asignados a él
                    $allTicketsUnfilteredQuery->where('technical_id', $technical->id);
                }
                // Si es técnico por defecto, ve todos los tickets
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
        $allTickets = $allTicketsQuery->get();
        $memberData = null;
        //cargar los datos del member
        $memberData = Tenant::where('email', $user->email)->first();
        $apartmentData = null;
        $buildingData = null;
        if ($memberData) {
            // Si no hay member, retornar error o redirigir
            $apartmentData = $memberData->apartment;
            $buildingData = $apartmentData->building;
        }




        return Inertia::render('Tickets/index', [
            'tickets' => $tickets,
            'allTickets' => $allTickets,
            'allTicketsUnfiltered' => $allTicketsUnfiltered,
            'devicesOwn' => $devicesOwn,
            'devicesShared' => $devicesShared,
            'memberData' => $memberData,
            'apartmentData' =>  $apartmentData,
            'buildingData' => $buildingData,
            'isTechnicalDefault' => $isTechnicalDefault,
            'isSuperAdmin' => $user->hasRole('super-admin'),
            'statusFilter' => $statusFilter, // Pasar el filtro actual al frontend
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
        ]);
        
        // Create ticket without assigning any technical - let it remain unassigned
        $ticket = Ticket::create([
            ...$validated,
            'user_id' => auth()->id(),
            'status' => Ticket::STATUS_OPEN,
            'technical_id' => null, // Leave unassigned
        ]);
        
        // Add initial history entry
        $user = auth()->user();
        $userName = 'System';
        
        // Try to get the user's name from tenant relationship if it's a member
        if ($user->hasRole('member')) {
            $tenant = \App\Models\Tenant::where('email', $user->email)->first();
            $userName = $tenant ? $tenant->name : $user->name;
        } else {
            $userName = $user->name;
        }
        
        $ticket->addHistory(
            'created',
            "Ticket created by {$userName}",
            null,
            null
        );
        
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
        $user = auth()->user();
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
        //
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
        $validated = $request->validate([
            'technical_id' => 'required|exists:technicals,id',
            'comment' => 'nullable|string|max:1000',
        ]);
        $oldTechnical = $ticket->technical_id;
        $newTechnical = Technical::findOrFail($validated['technical_id']);
        $ticket->technical_id = $validated['technical_id'];
        $ticket->save();

        // Get who is performing the assignment
        $user = auth()->user();
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
        // SIEMPRE redirige (no devuelvas JSON)
        
        return redirect()->back()->with('success', 'Technician assigned');
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
        $user = auth()->user();
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
        $user = auth()->user();
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
