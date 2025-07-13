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
        'icon_id',
        'ninjaone_device_id',
        'ninjaone_node_id',
        'ninjaone_serial_number',
        'ninjaone_asset_tag',
        'ninjaone_metadata',
        'ninjaone_last_seen',
        'ninjaone_enabled',
    ];

    protected $casts = [
        'ninjaone_metadata' => 'array',
        'ninjaone_last_seen' => 'datetime',
        'ninjaone_enabled' => 'boolean',
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

    /**
     * Get NinjaOne alerts for this device
     */
    public function ninjaoneAlerts()
    {
        return $this->hasMany(NinjaOneAlert::class);
    }

    /**
     * Get active NinjaOne alerts for this device
     */
    public function activeNinjaoneAlerts()
    {
        return $this->ninjaoneAlerts()->whereIn('status', ['open', 'acknowledged']);
    }

    /**
     * Check if device has active NinjaOne alerts
     */
    public function hasActiveNinjaoneAlerts(): bool
    {
        return $this->activeNinjaoneAlerts()->exists();
    }

    /**
     * Check if device has NinjaOne integration enabled
     */
    public function hasNinjaoneIntegration(): bool
    {
        return $this->ninjaone_enabled && !empty($this->ninjaone_device_id);
    }

    /**
     * Find device by name with flexible matching
     * Useful for NinjaOne webhook integration
     */
    public static function findByName(string $deviceName): ?self
    {
        // First try: exact match
        $device = static::where('name', $deviceName)->first();
        
        if ($device) {
            return $device;
        }
        
        // Second try: case-insensitive match
        $device = static::whereRaw('LOWER(name) = LOWER(?)', [$deviceName])->first();
        
        if ($device) {
            return $device;
        }
        
        // Third try: partial match (contains)
        return static::where('name', 'LIKE', '%' . $deviceName . '%')->first();
    }

    /**
     * Get all device owners (primary owner + shared users)
     */
    public function getAllOwners()
    {
        $owners = collect();
        
        // Add primary owner
        if ($this->owner && $this->owner->isNotEmpty()) {
            $owners = $owners->merge($this->owner);
        }
        
        // Add shared users
        if ($this->sharedWith && $this->sharedWith->isNotEmpty()) {
            $owners = $owners->merge($this->sharedWith);
        }
        
        return $owners->unique('id');
    }
}
