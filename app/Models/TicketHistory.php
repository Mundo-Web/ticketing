<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'technical_id',
        'user_id',
        'action',
        'description',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function technical()
    {
        return $this->belongsTo(Technical::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user name for this history entry
     */
    public function getUserNameAttribute()
    {
        // For member messages, use the user relationship
        if ($this->action === 'member_message' && $this->user) {
            return $this->user->tenant ? $this->user->tenant->name : $this->user->name;
        }
        
        if ($this->technical) {
            return $this->technical->name;
        }
        
        // If no technical, try to extract from meta data first
        if ($this->meta && isset($this->meta['actor_name'])) {
            return $this->meta['actor_name'];
        }
        
        // Try to extract from description (for appointment rescheduling)
        if (strpos($this->description, ' por ') !== false) {
            $parts = explode(' por ', $this->description);
            if (count($parts) >= 2) {
                $actorPart = $parts[1];
                // Extract name before " -" if there's a reason
                if (strpos($actorPart, ' -') !== false) {
                    $actorPart = explode(' -', $actorPart)[0];
                }
                return trim($actorPart);
            }
        }
        
        // Try to extract from description (for private notes)
        if (strpos($this->description, 'Private note by ') === 0) {
            $parts = explode('Private note by ', $this->description);
            if (count($parts) >= 2) {
                $actorPart = explode(':', $parts[1])[0];
                return trim($actorPart);
            }
        }
        
        return "System";
    }
}
