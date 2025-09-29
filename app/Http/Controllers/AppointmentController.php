<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Ticket;
use App\Models\Technical;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    /**
     * Display appointments calendar
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Get date range for calendar (default to current month)
        $startDate = $request->get('start', Carbon::now()->startOfMonth());
        $endDate = $request->get('end', Carbon::now()->endOfMonth());
        
        // Build query based on user role
        $appointmentsQuery = Appointment::with([
            'ticket.user', 
            'ticket.user.tenant',
            'ticket.user.tenant.apartment',
            'ticket.user.tenant.apartment.building',
            'ticket.device',
            'ticket.device.tenants',
            'ticket.device.tenants.apartment',
            'ticket.device.tenants.apartment.building',
            'technical'
        ])
            ->whereBetween('scheduled_for', [$startDate, $endDate]);
        
        if ($user->hasRole('technical')) {
            // Check if technical user is default
            $technical = Technical::where('email', $user->email)->first();
            
            if ($technical && !$technical->is_default) {
                // Regular technical users see only their appointments
                // Technical users with is_default = true see all appointments like super-admin
                $appointmentsQuery->where('technical_id', $technical->id);
            }
        } elseif ($user->hasRole('member')) {
            // Members see appointments for their tickets
            $appointmentsQuery->whereHas('ticket', function($query) use ($user) {
                $query->where('user_id', $user->id);
            });
        }
        // Super admin and technical users with is_default = true see all appointments
        
        $appointments = $appointmentsQuery->orderBy('scheduled_for')->get();
        //nuevo
        // Format appointments for calendar
        $calendarEvents = $appointments->map(function($appointment) {
            return [
                'id' => $appointment->id,
                'title' => $appointment->title,
                'start' => $appointment->scheduled_for,
                'end' => $appointment->estimated_end_time,
                'backgroundColor' => $this->getStatusColor($appointment->status),
                'borderColor' => $this->getStatusColor($appointment->status),
                'textColor' => '#fff',
                'extendedProps' => [
                    'appointment' => $appointment,
                    'ticket' => $appointment->ticket,
                    'technical' => $appointment->technical,
                    'status' => $appointment->status,
                ]
            ];
        });
        
        // Get technicals for scheduling
        $technicals = Technical::where('status', true)->get();
        
        // Check if technical user is default for frontend
        $isTechnicalDefault = false;
        if ($user->hasRole('technical')) {
            $technical = Technical::where('email', $user->email)->first();
            $isTechnicalDefault = $technical && $technical->is_default;
        }
        
        return Inertia::render('Appointments/Index', [
            'appointments' => $appointments,
            'calendarEvents' => $calendarEvents,
            'technicals' => $technicals,
            'currentDate' => Carbon::now()->toDateString(),
            'googleMapsApiKey' => env('GMAPS_API_KEY'),
            'isTechnicalDefault' => $isTechnicalDefault,
        ]);
    }

    /**
     * Show appointment details
     */
    public function show(Appointment $appointment)
    {
        $appointment->load(['ticket.user', 'ticket.device', 'technical', 'scheduledBy']);
        
        return Inertia::render('Appointments/Show', [
            'appointment' => $appointment
        ]);
    }

    /**
     * Get appointment details with full relationships
     */
    public function getDetails($id)
    {
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
            ])->find($id);

            if (!$appointment) {
                return response()->json(['error' => 'Appointment not found'], 404);
            }

            return response()->json([
                'appointment' => $appointment,
                'googleMapsApiKey' => env('GMAPS_API_KEY'),
                'success' => true
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch appointment details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Schedule a new appointment for a ticket
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ticket_id' => 'required|exists:tickets,id',
            'technical_id' => 'required|exists:technicals,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'scheduled_for' => 'required|date',
            'estimated_duration' => 'required|integer|min:30|max:480', // 30 minutes to 8 hours
            'member_instructions' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $ticket = Ticket::findOrFail($request->ticket_id);
        
        // Verify ticket can have appointment scheduled
        if (!$ticket->canScheduleAppointment()) {
            return back()->withErrors(['ticket' => 'Cannot schedule an appointment for this ticket in its current state.']);
        }

        $technical = Technical::findOrFail($request->technical_id);
        $user = Auth::user();

        // Check for scheduling conflicts
        $scheduledFor = Carbon::parse($request->scheduled_for);
        $estimatedEnd = $scheduledFor->copy()->addMinutes($request->estimated_duration);
        
        $conflicts = Appointment::where('technical_id', $request->technical_id)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->where(function($query) use ($scheduledFor, $estimatedEnd) {
                $query->whereBetween('scheduled_for', [$scheduledFor, $estimatedEnd])
                      ->orWhere(function($q) use ($scheduledFor, $estimatedEnd) {
                          $q->where('scheduled_for', '<=', $scheduledFor)
                            ->whereRaw('DATE_ADD(scheduled_for, INTERVAL estimated_duration MINUTE) >= ?', [$scheduledFor]);
                      });
            })->exists();

        if ($conflicts) {
            return back()->withErrors(['scheduled_for' => 'The technician already has an appointment scheduled at this time.']);
        }

        // Create appointment
        $appointment = Appointment::create([
            'ticket_id' => $request->ticket_id,
            'technical_id' => $request->technical_id,
            'scheduled_by' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'address' => $request->address ?: null, // Permitir null para address
            'scheduled_for' => $scheduledFor,
            'estimated_duration' => $request->estimated_duration,
            'member_instructions' => $request->member_instructions,
            'notes' => $request->notes,
        ]);

        // Add history to ticket
        $ticket->addHistory(
            'appointment_scheduled',
            "In-person appointment scheduled for {$scheduledFor->format('d/m/Y H:i')} with {$technical->name}",
            ['appointment_id' => $appointment->id],
            $technical->id
        );

        // Dispatch appointment created notification
        $notificationService = new \App\Services\NotificationDispatcherService();
        $notificationService->dispatchAppointmentCreated($appointment);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Appointment successfully scheduled',
                'appointment' => $appointment->load(['ticket', 'technical'])
            ]);
        }

        return redirect()->back()->with('success', 'Appointment successfully scheduled');
    }

    /**
     * Update appointment
     */
    public function update(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'sometimes|required|string',
            'scheduled_for' => 'sometimes|required|date',
            'estimated_duration' => 'sometimes|required|integer|min:30|max:480',
            'member_instructions' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $appointment->update($request->only([
            'title', 'description', 'address', 'scheduled_for', 
            'estimated_duration', 'member_instructions', 'notes'
        ]));

        return redirect()->back()->with('success', 'Appointment successfully updated');
    }

    /**
     * Start an appointment (technician arrives)
     */
    public function start(Appointment $appointment)
    {
        try {
            $appointment->start();
            
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Visita iniciada exitosamente',
                    'appointment' => $appointment->fresh()
                ]);
            }

            return redirect()->back()->with('success', 'Appointment successfully started');
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Complete an appointment (Technical side - only completion notes)
     */
    public function complete(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'completion_notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            // Set status to awaiting_feedback and save completion notes
            $appointment->update([
                'status' => 'awaiting_feedback',
                'completion_notes' => $request->completion_notes,
                'completed_at' => now(),
            ]);

            // Add to appointment history via ticket
            $appointment->ticket->addHistory(
                'technical_completed',
                'Technical completed visit',
                [
                    'completion_notes' => $request->completion_notes,
                    'completed_by' => Auth::user()->name,
                    'action' => 'technical_completed'
                ]
            );

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Visit completed. Waiting for member feedback.',
                    'appointment' => $appointment->fresh()
                ]);
            }

            return redirect()->back()->with('success', 'Visit completed successfully. Member will provide feedback.');
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Member feedback for completed appointment
     */
    public function memberFeedback(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'member_feedback' => 'nullable|string',
            'service_rating' => 'required|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            // Update appointment with member feedback and mark as completed
            $appointment->update([
                'status' => 'completed',
                'member_feedback' => $request->member_feedback,
                'service_rating' => $request->service_rating,
            ]);

            // Add to appointment history via ticket
            $appointment->ticket->addHistory(
                'member_feedback',
                'Member provided feedback',
                [
                    'member_feedback' => $request->member_feedback,
                    'service_rating' => $request->service_rating,
                    'feedback_by' => Auth::user()->name,
                    'action' => 'member_feedback'
                ]
            );

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Thank you for your feedback!',
                    'appointment' => $appointment->fresh()
                ]);
            }

            return redirect()->back()->with('success', 'Thank you for your feedback! Appointment is now complete.');
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Cancel an appointment
     */
    public function cancel(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $appointment->cancel($request->reason);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Cita cancelada exitosamente',
                    'appointment' => $appointment->fresh()
                ]);
            }

            return redirect()->back()->with('success', 'Appointment successfully cancelled');
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Reschedule an appointment
     */
    public function reschedule(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'new_scheduled_for' => 'required|date',
            'reason' => 'nullable|string|max:500', // Cambiar de required a nullable
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Skip date validation - allow any date to be selected
        // This allows users to reschedule appointments for any date they need
        
        // Check for conflicts using the string date directly
        $newDateTime = Carbon::parse($request->new_scheduled_for);
        $estimatedEnd = $newDateTime->copy()->addMinutes($appointment->estimated_duration);
        
        $conflicts = Appointment::where('technical_id', $appointment->technical_id)
            ->where('id', '!=', $appointment->id)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->where(function($query) use ($newDateTime, $estimatedEnd) {
                $query->whereBetween('scheduled_for', [$newDateTime, $estimatedEnd])
                      ->orWhere(function($q) use ($newDateTime, $estimatedEnd) {
                          $q->where('scheduled_for', '<=', $newDateTime)
                            ->whereRaw('DATE_ADD(scheduled_for, INTERVAL estimated_duration MINUTE) >= ?', [$newDateTime]);
                      });
            })->exists();

        if ($conflicts) {
            return back()->withErrors(['new_scheduled_for' => 'The technician already has an appointment scheduled at this time.']);
        }

        try {
            $appointment->reschedule($request->new_scheduled_for, $request->reason, Auth::user());

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment successfully rescheduled',
                    'appointment' => $appointment->fresh()
                ]);
            }

            return redirect()->back()->with('success', 'Appointment successfully rescheduled');
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Mark an appointment as No Show
     */
    public function noShow(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            return back()->withErrors($validator)->withInput();
        }

        try {
            // Update appointment status to no-show
            $appointment->status = Appointment::STATUS_NO_SHOW;
            $appointment->no_show_reason = $request->reason;
            $appointment->no_show_description = $request->description;
            $appointment->marked_no_show_at = Carbon::now();
            $appointment->marked_no_show_by = Auth::id();
            $appointment->save();

            $appointment->save();

            // Add to ticket timeline if there's a related ticket
            if ($appointment->ticket_id) {
                Log::info("Attempting to add timeline entry for appointment {$appointment->id} with ticket {$appointment->ticket_id}");
                $ticket = $appointment->ticket;
                if ($ticket) {
                    Log::info("Ticket found: {$ticket->id}");
                    $userName = Auth::user()->name;
                    $description = "Appointment marked as No Show - Reason: {$request->reason}";
                    if ($request->description) {
                        $description .= " - Description: {$request->description}";
                    }
                    $description .= " by {$userName}";

                    $historyData = [
                        'action' => 'appointment_no_show',
                        'description' => $description,
                        'technical_id' => null, // Don't use technical_id, use meta for attribution
                        'meta' => [
                            'appointment_id' => $appointment->id,
                            'no_show_reason' => $request->reason,
                            'no_show_description' => $request->description,
                            'actor_name' => $userName,
                            'actor_id' => Auth::id(),
                            'marked_at' => Carbon::now()->toISOString()
                        ]
                    ];
                    
                    Log::info("Creating timeline entry with data: " . json_encode($historyData));
                    
                    try {
                        $historyEntry = $ticket->histories()->create($historyData);
                        Log::info("Timeline entry created successfully with ID: {$historyEntry->id}");
                    } catch (\Exception $e) {
                        Log::error("Failed to create timeline entry: " . $e->getMessage());
                        throw $e;
                    }
                } else {
                    Log::error("Ticket not found for appointment {$appointment->id} with ticket_id {$appointment->ticket_id}");
                }
            } else {
                Log::info("Appointment {$appointment->id} has no ticket_id");
            }

            // Log the action
            Log::info("Appointment {$appointment->id} marked as no-show", [
                'appointment_id' => $appointment->id,
                'reason' => $request->reason,
                'description' => $request->description,
                'marked_by' => Auth::id()
            ]);

            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Appointment marked as No Show successfully',
                    'appointment' => $appointment->fresh()
                ]);
            }

            return redirect()->back()->with('success', 'Appointment marked as No Show successfully');
        } catch (\Exception $e) {
            Log::error("Error marking appointment as no-show: " . $e->getMessage());
            
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error marking appointment as no-show'
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Error marking appointment as no-show']);
        }
    }

    /**
     * Get technician's availability for a specific date
     */
    public function getTechnicalAvailability(Request $request, Technical $technical)
    {
        $date = $request->get('date', Carbon::today());
        $date = Carbon::parse($date);
        
        // Get existing appointments for this technician on this date
        $appointments = Appointment::where('technical_id', $technical->id)
            ->whereDate('scheduled_for', $date)
            ->where('status', Appointment::STATUS_SCHEDULED)
            ->orderBy('scheduled_for')
            ->get(['scheduled_for', 'estimated_duration']);
        
        // Define working hours (8 AM to 6 PM)
        $workStart = $date->copy()->setTime(8, 0);
        $workEnd = $date->copy()->setTime(18, 0);
        
        $availableSlots = [];
        $currentTime = $workStart->copy();
        
        foreach ($appointments as $appointment) {
            $appointmentStart = Carbon::parse($appointment->scheduled_for);
            $appointmentEnd = $appointmentStart->copy()->addMinutes($appointment->estimated_duration);
            
            // Add slots before this appointment
            while ($currentTime->copy()->addMinutes(60) <= $appointmentStart) {
                $availableSlots[] = [
                    'start' => $currentTime->format('H:i'),
                    'end' => $currentTime->copy()->addMinutes(60)->format('H:i'),
                    'datetime' => $currentTime->toISOString()
                ];
                $currentTime->addMinutes(60);
            }
            
            // Skip to after this appointment
            $currentTime = $appointmentEnd->copy();
        }
        
        // Add remaining slots until end of work day
        while ($currentTime->copy()->addMinutes(60) <= $workEnd) {
            $availableSlots[] = [
                'start' => $currentTime->format('H:i'),
                'end' => $currentTime->copy()->addMinutes(60)->format('H:i'),
                'datetime' => $currentTime->toISOString()
            ];
            $currentTime->addMinutes(60);
        }
        
        return response()->json([
            'date' => $date->toDateString(),
            'technician' => $technical->name,
            'available_slots' => $availableSlots,
            'existing_appointments' => $appointments
        ]);
    }

    /**
     * Get status color for calendar events
     */
    private function getStatusColor($status)
    {
        return match($status) {
            Appointment::STATUS_SCHEDULED => '#3b82f6', // blue
            Appointment::STATUS_IN_PROGRESS => '#f59e0b', // yellow
            Appointment::STATUS_COMPLETED => '#10b981', // green
            Appointment::STATUS_CANCELLED => '#ef4444', // red
            Appointment::STATUS_RESCHEDULED => '#6b7280', // gray
            default => '#6b7280'
        };
    }
}
