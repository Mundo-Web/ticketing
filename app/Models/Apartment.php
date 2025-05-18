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
       

    ];
    protected $casts = [
        'status' => 'boolean',

    ];

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class, 'buildings_id');
    }

    public function tenants()
    {
        return $this->hasMany(Tenant::class);
    }  
    
  

}
