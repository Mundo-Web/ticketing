<?php

namespace App\Http\Controllers;

use App\Models\Technical;
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
        $ticketsQuery = Ticket::with(['technical', 'device', 'device.name_device', 'histories.technical']);

        if ($user->hasRole('super-admin')) {
            // Ver todos los tickets
            // No filter
        } elseif ($user->hasRole('technical')) {
            // Buscar el técnico correspondiente al usuario autenticado por email
            $technical = Technical::where('email', $user->email)->first();
            if ($technical) {
            // Ver tickets asignados a ese técnico
            $ticketsQuery->where('technical_id', $technical->id);
            } else {
            // Si no hay técnico asociado, no mostrar tickets
            $ticketsQuery->whereRaw('1 = 0');
            }
        } else {
            // Ver solo tickets creados por el usuario
            $ticketsQuery->where('user_id', $user->id);
        }

        $tickets = $ticketsQuery->latest()->paginate(10);

        return Inertia::render('Tickets/index', [
            'tickets' => $tickets
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
        $defaultTechnical = Technical::where('is_default',true)->orderBy('id')->first();
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
        $ticket = Ticket::with(['technical', 'device', 'device.name_device', 'histories.technical'])->findOrFail($id);
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
            'status' => 'required|in:open,in_progress,resolved,closed,cancelled',
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
        return response()->json(['success' => true, 'ticket' => $ticket->load(['technical', 'histories.technical'])]);
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

        $history = $ticket->addHistory(
            $validated['action'],
            $validated['description'] ?? null,
            $validated['meta'] ?? null,
            $technicalId
        );
        return response()->json(['success' => true, 'history' => $history]);
    }
}
