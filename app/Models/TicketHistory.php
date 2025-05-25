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
        'action',
        'description',
        'meta',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function technical()
    {
        return $this->belongsTo(Technical::class);
    }
}
