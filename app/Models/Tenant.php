<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'apartment_id',
        'name',
        'email',
        'photo',
        'phone',
        'visible',
        'status'
    ];

    public function apartment()
    {
        return $this->belongsTo(Apartment::class);
    }
}
