<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Building extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'image',
        'description',
        'location_link',
        'status'
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function owner(): HasOne
    {
        return $this->hasOne(Owner::class);
    }

    public function doormen(): HasMany
    {
        return $this->hasMany(Doorman::class);
    }

    public function apartments(): HasMany
    {
        return $this->hasMany(Apartment::class, 'buildings_id');
    }
}
