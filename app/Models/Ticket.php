<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory, Auditable;

    protected $appends = ['active_appointment'];
    
    protected $fillable = [
        'user_id',
        'device_id',
        'category',
        'title',
        'description',
        'attachments',
        'status',
        'priority',
        'source',
        'resolved_at',
        'closed_at',
        'code',
        'technical_id',
        'created_by_owner_id',
        'created_by_doorman_id',
        'created_by_admin_id',
    ];

    protected $casts = [
        'attachments' => 'array',
    ];
    // Boot: generar código único al crear
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($ticket) {
            $lastId = self::max('id') + 1;
            $ticket->code = 'TCK-' . str_pad($lastId, 5, '0', STR_PAD_LEFT);
        });
    }

    public function histories()
    {
        return $this->hasMany(TicketHistory::class);
    }

    // Helper para registrar eventos en el historial
    public function addHistory($action, $description = null, $meta = null, $technical_id = null)
    {
        return $this->histories()->create([
            'action' => $action,
            'description' => $description,
            'meta' => $meta, // Ya no necesitamos json_encode gracias al cast
            'technical_id' => $technical_id,
        ]);
    }

    // Estados posibles del ticket
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REOPENED = 'reopened';
    public function isReopened() { return $this->status === self::STATUS_REOPENED; }

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function technical()
    {
        return $this->belongsTo(Technical::class);
    }

    public function createdByOwner()
    {
        return $this->belongsTo(\App\Models\Owner::class, 'created_by_owner_id');
    }

    public function createdByDoorman()
    {
        return $this->belongsTo(\App\Models\Doorman::class, 'created_by_doorman_id');
    }

    public function createdByAdmin()
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }

    // Relación con citas
    public function appointments()
    {
        return $this->hasMany(Appointment::class)->orderBy('scheduled_for', 'desc');
    }

    // Cita activa (la más reciente no cancelada)
    public function activeAppointment()
    {
        return $this->hasOne(Appointment::class)
                    ->whereIn('status', [Appointment::STATUS_SCHEDULED, Appointment::STATUS_IN_PROGRESS, Appointment::STATUS_AWAITING_FEEDBACK])
                    ->orderBy('scheduled_for', 'desc');
    }
    
    // Accessor para asegurar que active_appointment esté disponible
    public function getActiveAppointmentAttribute()
    {
        return $this->activeAppointment()->first();
    }

    // Última cita completada
    public function lastCompletedAppointment()
    {
        return $this->hasOne(Appointment::class)
                    ->where('status', Appointment::STATUS_COMPLETED)
                    ->orderBy('completed_at', 'desc');
    }

    // Relación con comentarios
    public function comments()
    {
        return $this->hasMany(TicketComment::class)->orderBy('created_at', 'desc');
    }

    // Comentarios públicos
    public function publicComments()
    {
        return $this->hasMany(TicketComment::class)->where('is_internal', false)->orderBy('created_at', 'desc');
    }

    // Comentarios internos
    public function internalComments()
    {
        return $this->hasMany(TicketComment::class)->where('is_internal', true)->orderBy('created_at', 'desc');
    }

    // Métodos de ayuda para estados
    public function isOpen() { return $this->status === self::STATUS_OPEN; }
    public function isInProgress() { return $this->status === self::STATUS_IN_PROGRESS; }
    public function isResolved() { return $this->status === self::STATUS_RESOLVED; }
    public function isClosed() { return $this->status === self::STATUS_CLOSED; }
    public function isCancelled() { return $this->status === self::STATUS_CANCELLED; }

    // Métodos de ayuda para citas
    public function canScheduleAppointment()
    {
        return $this->isInProgress() && $this->technical_id && !$this->activeAppointment;
    }

    public function hasActiveAppointment()
    {
        return $this->activeAppointment !== null;
    }

    public function needsOnSiteVisit()
    {
        // Ticket needs on-site visit if it's in progress and technician indicates remote resolution failed
        return $this->isInProgress() && $this->technical_id;
    }
}
