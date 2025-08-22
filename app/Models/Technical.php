<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Technical extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'photo',
        'phone',
        'shift',
        'status',
        'visible',
        'is_default',
        'instructions',
    ];

    protected $casts = [
        'instructions' => 'array',
    ];

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function devices()
    {
        return $this->hasMany(Device::class, 'technical_id');
    }

    // Métodos auxiliares para estadísticas
    public function getWeeklyStats()
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        return [
            'total_tickets' => $this->tickets()->whereBetween('created_at', [$startOfWeek, $endOfWeek])->count(),
            'resolved_tickets' => $this->tickets()->where('status', Ticket::STATUS_RESOLVED)->whereBetween('created_at', [$startOfWeek, $endOfWeek])->count(),
            'pending_tickets' => $this->tickets()->whereIn('status', [Ticket::STATUS_OPEN, Ticket::STATUS_IN_PROGRESS])->count(),
            'devices_assigned' => $this->devices()->count(),
        ];
    }

    public function getTicketsByStatus()
    {
        return [
            'open' => $this->tickets()->where('status', Ticket::STATUS_OPEN)->count(),
            'in_progress' => $this->tickets()->where('status', Ticket::STATUS_IN_PROGRESS)->count(),
            'resolved' => $this->tickets()->where('status', Ticket::STATUS_RESOLVED)->count(),
            'closed' => $this->tickets()->where('status', Ticket::STATUS_CLOSED)->count(),
        ];
    }
}
