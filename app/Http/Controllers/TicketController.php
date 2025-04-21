<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Support;
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
        //$tickets = Ticket::paginate(10);
        $tickets = Ticket::with(['customer', 'support'])->latest()->paginate(10);
        return Inertia::render('Tickets/index', [
            'tickets' => $tickets
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        $customers = Customer::select('id', 'name')->get();
        $supports = Support::select('id', 'name')->get();

        return Inertia::render('Tickets.create', [
            'customers' => $customers,
            'supports' => $supports,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'require|exists:customers,id',
                'technical_support_id' => 'nullable|exists:support,id',
                'description' => 'required|string',
                'status' => 'require|in:open, in Progress, clodsed'
            ]);
            Ticket::create($validated);
            return redirect()->route('tickets.index')->with('success', 'Registro grabado');

        } catch (\Exception $e) {
            return redirect()->back()->with('error'. 'hay unerror' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
        
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ticket $ticket)
    {
        //
        $customers = Customer::select('id', 'name')->get();
        $supports = Support::select('id', 'name')->get();

        return Inertia::render('Tickets.edit', [
            'ticket' => $ticket->load(['customer', 'support']),
            'customers' => $customers,
            'supports' => $supports,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ticket $ticket)
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'require|exists:customers,id',
                'technical_support_id' => 'nullable|exists:support,id',
                'description' => 'required|string',
                'status' => 'require|in:open, in Progress, clodsed'
            ]);
            Ticket::update($validated);
            return redirect()->route('tickets.index')->with('success', 'Registro actualizad');

        } catch (\Exception $e) {
            return redirect()->back()->with('error'. 'hay unerror' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
