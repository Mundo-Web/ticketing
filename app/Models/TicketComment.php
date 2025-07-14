<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'user_id',
        'comment',
        'attachments',
        'is_internal'
    ];

    protected $casts = [
        'attachments' => 'array',
        'is_internal' => 'boolean'
    ];

    /**
     * Relación con el ticket
     */
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Relación con el usuario que hizo el comentario
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope para comentarios públicos
     */
    public function scopePublic($query)
    {
        return $query->where('is_internal', false);
    }

    /**
     * Scope para comentarios internos
     */
    public function scopeInternal($query)
    {
        return $query->where('is_internal', true);
    }
}
