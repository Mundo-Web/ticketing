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
    ];

    // Estados posibles del ticket
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_CANCELLED = 'cancelled';

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    // Métodos de ayuda para estados
    public function isOpen() { return $this->status === self::STATUS_OPEN; }
    public function isInProgress() { return $this->status === self::STATUS_IN_PROGRESS; }
    public function isResolved() { return $this->status === self::STATUS_RESOLVED; }
    public function isClosed() { return $this->status === self::STATUS_CLOSED; }
    public function isCancelled() { return $this->status === self::STATUS_CANCELLED; }
}
