<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Apartment extends Model
{
    /** @use HasFactory<\Database\Factories\ApartmentFactory> */
    use HasFactory;
    protected $fillable = [
        'name',
        'ubicacion',
        'buildings_id',
        'status',
        'share',

    ];
    protected $casts = [
        'status' => 'boolean',
        'share' => 'boolean'
    ];

    public function devices()
    {
        return $this->belongsToMany(Device::class, 'apartment_device');
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class, 'buildings_id');
    }

    public function tenant(): HasOne
    {
        return $this->hasOne(Tenant::class);
    }
}
