<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'technical_id',
        'scheduled_by',
        'title',
        'description',
        'address',
        'scheduled_for',
        'estimated_duration',
        'status',
        'notes',
        'member_instructions',
        'completion_notes',
        'started_at',
        'completed_at',
        'member_feedback',
        'rating'
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'member_feedback' => 'array',
    ];

    // Status constants
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_RESCHEDULED = 'rescheduled';

    // Relationships
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function technical()
    {
        return $this->belongsTo(Technical::class);
    }

    public function scheduledBy()
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_for', '>=', Carbon::now())
                    ->whereIn('status', [self::STATUS_SCHEDULED]);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_for', Carbon::today())
                    ->whereIn('status', [self::STATUS_SCHEDULED, self::STATUS_IN_PROGRESS]);
    }

    public function scopeForTechnical($query, $technicalId)
    {
        return $query->where('technical_id', $technicalId);
    }

    public function scopeForTicket($query, $ticketId)
    {
        return $query->where('ticket_id', $ticketId);
    }

    // Accessors & Mutators
    public function getFormattedScheduledForAttribute()
    {
        return $this->scheduled_for ? $this->scheduled_for->format('d/m/Y H:i') : null;
    }

    public function getEstimatedEndTimeAttribute()
    {
        return $this->scheduled_for ? 
            $this->scheduled_for->addMinutes($this->estimated_duration) : null;
    }

    public function getFormattedEstimatedEndTimeAttribute()
    {
        return $this->estimated_end_time ? $this->estimated_end_time->format('H:i') : null;
    }

    public function getDurationInHoursAttribute()
    {
        return $this->estimated_duration / 60;
    }

    // Helper methods
    public function isUpcoming()
    {
        return $this->scheduled_for > Carbon::now() && $this->status === self::STATUS_SCHEDULED;
    }

    public function isToday()
    {
        return $this->scheduled_for->isToday() && 
               in_array($this->status, [self::STATUS_SCHEDULED, self::STATUS_IN_PROGRESS]);
    }

    public function canStart()
    {
        return $this->status === self::STATUS_SCHEDULED && 
               $this->scheduled_for <= Carbon::now()->addMinutes(15); // Can start 15 minutes early
    }

    public function canComplete()
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function canCancel()
    {
        return in_array($this->status, [self::STATUS_SCHEDULED]);
    }

    public function canReschedule()
    {
        return in_array($this->status, [self::STATUS_SCHEDULED]);
    }

    // Status color helpers for UI
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            self::STATUS_SCHEDULED => 'blue',
            self::STATUS_IN_PROGRESS => 'yellow',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_CANCELLED => 'red',
            self::STATUS_RESCHEDULED => 'gray',
            default => 'gray'
        };
    }

    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            self::STATUS_SCHEDULED => 'Agendada',
            self::STATUS_IN_PROGRESS => 'En Progreso',
            self::STATUS_COMPLETED => 'Completada',
            self::STATUS_CANCELLED => 'Cancelada',
            self::STATUS_RESCHEDULED => 'Reagendada',
            default => $this->status
        };
    }

    // Business logic methods
    public function start()
    {
        if (!$this->canStart()) {
            throw new \Exception('No se puede iniciar esta cita en este momento.');
        }

        $this->update([
            'status' => self::STATUS_IN_PROGRESS,
            'started_at' => Carbon::now()
        ]);

        // Add history to ticket
        $this->ticket->addHistory(
            'appointment_started',
            "Visita presencial iniciada por {$this->technical->name}",
            ['appointment_id' => $this->id],
            $this->technical_id
        );

        return $this;
    }

    public function complete($completionNotes = null, $memberFeedback = null, $rating = null)
    {
        if (!$this->canComplete()) {
            throw new \Exception('No se puede completar esta cita en su estado actual.');
        }

        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => Carbon::now(),
            'completion_notes' => $completionNotes,
            'member_feedback' => $memberFeedback,
            'rating' => $rating
        ]);

        // Add history to ticket
        $this->ticket->addHistory(
            'appointment_completed',
            "Visita presencial completada por {$this->technical->name}" . 
            ($completionNotes ? " - {$completionNotes}" : ''),
            ['appointment_id' => $this->id],
            $this->technical_id
        );

        return $this;
    }

    public function cancel($reason = null)
    {
        if (!$this->canCancel()) {
            throw new \Exception('No se puede cancelar esta cita en su estado actual.');
        }

        $this->update([
            'status' => self::STATUS_CANCELLED,
            'notes' => $this->notes . ($reason ? "\n\nCancelada: {$reason}" : '')
        ]);

        // Add history to ticket
        $this->ticket->addHistory(
            'appointment_cancelled',
            "Cita cancelada" . ($reason ? " - {$reason}" : ''),
            ['appointment_id' => $this->id],
            $this->technical_id
        );

        return $this;
    }

    public function reschedule($newDateTime, $reason = null)
    {
        if (!$this->canReschedule()) {
            throw new \Exception('No se puede reagendar esta cita en su estado actual.');
        }

        $oldDate = $this->scheduled_for;
        
        $this->update([
            'scheduled_for' => $newDateTime,
            'status' => self::STATUS_SCHEDULED, // Reset to scheduled
            'notes' => $this->notes . ($reason ? "\n\nReagendada: {$reason}" : '')
        ]);

        // Add history to ticket
        $this->ticket->addHistory(
            'appointment_rescheduled',
            "Cita reagendada de {$oldDate->format('d/m/Y H:i')} a {$newDateTime->format('d/m/Y H:i')}" . 
            ($reason ? " - {$reason}" : ''),
            ['appointment_id' => $this->id, 'old_date' => $oldDate, 'new_date' => $newDateTime],
            $this->technical_id
        );

        return $this;
    }
}
