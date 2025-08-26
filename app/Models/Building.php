<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Building extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'name',
        'managing_company',
        'address',
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
