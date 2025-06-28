<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        return $this->hasMany(Ticket::class, 'user_id')
            ->join('users', 'tickets.user_id', '=', 'users.id')
            ->where('users.email', $this->email)
            ->select('tickets.*');
    }

    public function ticketsCount()
    {
        return $this->tickets()->count();
    }

}
