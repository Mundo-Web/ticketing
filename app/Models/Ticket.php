<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    //
    use HasFactory;


    protected $fillable = [
        'user_id',
        'device_id',
        'category',
        'title',
        'description',
        'status',
        'resolved_at',
        'closed_at',
        'code',
        'technical_id',
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
            'meta' => $meta ? json_encode($meta) : null,
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

    // Métodos de ayuda para estados
    public function isOpen() { return $this->status === self::STATUS_OPEN; }
    public function isInProgress() { return $this->status === self::STATUS_IN_PROGRESS; }
    public function isResolved() { return $this->status === self::STATUS_RESOLVED; }
    public function isClosed() { return $this->status === self::STATUS_CLOSED; }
    public function isCancelled() { return $this->status === self::STATUS_CANCELLED; }
}
