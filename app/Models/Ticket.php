<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'support_id',
        'dewcription',
        'status'
    ];

    public function customer(){
        return $this->belongsTo(Customer::class);
    }

    public function support(){
        return $this->belongsTo(Support::class);
    }
}
