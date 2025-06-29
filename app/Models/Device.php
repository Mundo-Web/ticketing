<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Device extends Model
{
  
    use HasFactory;
    protected $fillable = [
        'name',
        'brand_id',
        'system_id',
        'model_id',
        'name_device_id',
        'status',
        'ubicacion',
    ];


    


    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function system()
    {
        return $this->belongsTo(System::class);
    }

    public function model()
    {
        return $this->belongsTo(DeviceModel::class);
    }
    public function name_device()
    {
        return $this->belongsTo(NameDevice::class);
    }

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class);
    }


    // Relación con el tenant principal (dueño)
    public function owner()
    {
        return $this->belongsToMany(Tenant::class, 'share_device_tenant', 'device_id', 'owner_tenant_id')
            ->distinct()
            ->withPivot('shared_with_tenant_id');
    }

    // Relación con tenants compartidos
    public function sharedWith()
    {
        return $this->belongsToMany(Tenant::class, 'share_device_tenant', 'device_id', 'shared_with_tenant_id')
            ->withPivot('owner_tenant_id');
    }
    
    // Relación completa con tenants (dueño + compartidos)
    public function allTenants()
    {
        return $this->owner->merge($this->sharedWith);
    }
    
    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }


}
