<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'description',
        'status',
        'image'
    ];
    protected $casts = [
        'status' => 'boolean',
    ];


    public function Tickets()
    {
        return $this->hasMany(Ticket::class);
    }



    public function apartments(): HasMany
    {
        return $this->hasMany(Apartment::class, 'customers_id');
    }
}
