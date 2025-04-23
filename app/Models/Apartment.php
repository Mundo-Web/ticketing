<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Apartment extends Model
{
    /** @use HasFactory<\Database\Factories\ApartmentFactory> */
    use HasFactory;
    protected $fillable = [
        'name',
        'ubicacion',
        'customers_id',
        'status',

    ];
    protected $casts = [
        'status' => 'boolean',
    ];

    public function devices()
    {
        return $this->belongsToMany(Device::class, 'apartment_device');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customers_id');
    }
}
