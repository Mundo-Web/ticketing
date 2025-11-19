<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Technical;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TechnicalController extends Controller
{
    /**
     * List all technicals (for jefe view)
     */    
    public function index()
    {
        $technicals = Technical::select('id', 'name', 'email', 'photo', 'shift', 'status', 'is_default')->get();
        \Illuminate\Support\Facades\Log::info('API /api/technicals llamado. Técnicos encontrados: ' . $technicals->count());
        return response()->json(['technicals' => $technicals]);
    }

    /**
     * Get tickets for a specific technical with enhanced filtering options
     */
    public function getTickets(Request $request, $technicalId)
    {
        $technical = Technical::findOrFail($technicalId);
        $type = $request->get('type', 'all');
        
        $query = $technical->tickets()
            ->with(['building:id,name', 'device:id,name', 'apartment:id,number'])
            ->select('id', 'title', 'status', 'priority', 'created_at', 'building_id', 'device_id', 'apartment_id');
        
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
                // Recent completed tickets from last 7 days (excluding active tickets)
                $query->where('created_at', '>=', now()->subDays(7))
                      ->whereIn('status', ['resolved', 'closed']);
                break;
            case 'all':
            default:
                // No additional filtering for 'all'
                break;
        }
        
        $tickets = $query->latest()->get();
        
        return response()->json($tickets);
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

        // Calculate resolution time if ticket is resolved
        if ($ticket->status === 'resolved' && $ticket->resolved_at) {
            $ticket->resolution_time = $ticket->created_at->diffInHours($ticket->resolved_at);
        }

        // Add mock rating and feedback for demonstration
        if ($ticket->status === 'resolved') {
            $ticket->rating = rand(3, 5);
            $ticket->feedback = [
                "Great job! Very professional service.",
                "Quick resolution, thank you!",
                "Excellent technical support.",
                "Very satisfied with the service.",
                "Outstanding work, highly recommend!"
            ][rand(0, 4)];
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
        
        $query = \App\Models\Appointment::where('technical_id', $technical->id)
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
        
        // Enrich appointments with tenant info
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
