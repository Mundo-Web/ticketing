<?php

namespace App\Http\Controllers;

use App\Models\Technical;
use App\Models\Tenant;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Listar tickets del usuario autenticado (o todos si es super-admin, o asignados si es technical)
        $user = auth()->user();
        $withRelations = [
            'technical',
            'device',
            'device.name_device',
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
            'devicesOwn' => $devicesOwn,
            'devicesShared' => $devicesShared,
            'memberData' => $memberData,
            'apartmentData' =>  $apartmentData,
            'buildingData' => $buildingData,
            'isTechnicalDefault' => $isTechnicalDefault,
            'isSuperAdmin' => $user->hasRole('super-admin'),
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
        // Buscar técnico por defecto (ejemplo: primero con shift 'morning' y visible)
        $defaultTechnical = Technical::where('is_default', true)->orderBy('id')->first();
        $ticket = Ticket::create([
            ...$validated,
            'user_id' => auth()->id(),
            'status' => Ticket::STATUS_OPEN,
            'technical_id' => $defaultTechnical ? $defaultTechnical->id : null,
        ]);
        if ($defaultTechnical) {
            $ticket->addHistory(
                'assigned_technical',
                'Ticket asignado automáticamente al técnico principal',
                ['to' => $defaultTechnical->id],
                $defaultTechnical->id
            );
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
            'device',
            'device.name_device',
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
        // Obtener el usuario autenticado
        $user = auth()->user();
        // Buscar el técnico correspondiente al usuario autenticado por email
        $technical = Technical::where('email', $user->email)->first();
        $technicalId = $technical ? $technical->id : null;
        // Agregar al historial
        $ticket->addHistory(
            'status_updated',
            'Estado del ticket actualizado a ' . $ticket->status,
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
        $ticket->technical_id = $validated['technical_id'];
        $ticket->save();
        $ticket->addHistory(
            'assigned_technical',
            $validated['comment'] ?? 'Ticket asignado a técnico',
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

        $ticket->addHistory(
            $validated['action'],
            $validated['description'] ?? null,
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

        // Opcional: agrega historial de cambio de estado
        $ticket->addHistory(
            'status_updated',
            'Estado del ticket actualizado a ' . $validated['status'],
            null,
            auth()->user()->technical->id ?? null
        );

        // Para peticiones AJAX/JSON
        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        // Para Inertia
        return redirect()->back()->with('success', 'Status updated');
    }
}
