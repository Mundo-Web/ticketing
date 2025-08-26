<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tenant extends Model
{
    use HasFactory, Auditable;

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

    public function devices(): BelongsToMany
    {
        return $this->belongsToMany(Device::class);
    }

    public function sharedDevices()
    {
        return $this->belongsToMany(Device::class, 'share_device_tenant', 'shared_with_tenant_id', 'device_id')
            ->withPivot('owner_tenant_id');
    }

    public function tickets()
    {
        // Obtener tickets del usuario asociado a este tenant
        $user = \App\Models\User::where('email', $this->email)->first();
        if ($user) {
            return $user->hasMany(\App\Models\Ticket::class, 'user_id');
        }
        
        // Si no existe usuario, devolver relación vacía
        return $this->hasMany(\App\Models\Ticket::class, 'user_id', 'id')->whereRaw('1 = 0');
    }

    public function ticketsCount()
    {
        return $this->tickets()->count();
    }

}
