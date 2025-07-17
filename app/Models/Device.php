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
        'is_in_ninjaone',
        'ninjaone_device_id',
        'ninjaone_node_id',
        'ninjaone_serial_number',
        'ninjaone_asset_tag',
        'ninjaone_metadata',
        'ninjaone_last_seen',
        'ninjaone_enabled',
        'ninjaone_system_name',
        'ninjaone_hostname',
        'ninjaone_status',
        'ninjaone_issues_count',
        'ninjaone_online',
        'ninjaone_needs_attention',
        'ninjaone_os',
    ];

    protected $casts = [
        'ninjaone_metadata' => 'array',
        'ninjaone_last_seen' => 'datetime',
        'ninjaone_enabled' => 'boolean',
        'ninjaone_online' => 'boolean',
        'ninjaone_needs_attention' => 'boolean',
        'ninjaone_issues_count' => 'integer',
        'is_in_ninjaone' => 'boolean',
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
     * Fetch alerts from NinjaOne API by device name
     */
    public function fetchNinjaOneAlertsByName()
    {
        if (!$this->ninjaone_enabled) {
            return [];
        }
        
        // Usar el campo name si existe, o name_device->name como fallback
        $searchName = $this->name;
        if (empty($searchName) && $this->name_device) {
            $searchName = $this->name_device->name;
        }
        
        if (empty($searchName)) {
            \Illuminate\Support\Facades\Log::error('Device has no name to match with NinjaOne', ['device_id' => $this->id]);
            return [];
        }
        
        $ninjaOneService = app(\App\Services\NinjaOneService::class);
        return $ninjaOneService->getDeviceAlertsByName($searchName);
    }
    
    /**
     * Get the health status of the device from NinjaOne
     */
    public function getNinjaOneHealthStatus()
    {
        if (!$this->ninjaone_enabled || !$this->ninjaone_device_id) {
            return null;
        }
        
        $ninjaOneService = app(\App\Services\NinjaOneService::class);
        return $ninjaOneService->getDeviceHealthStatus($this->ninjaone_device_id);
    }
    
    /**
     * Sync this device with NinjaOne
     */
    public function syncWithNinjaOne(): bool
    {
        if (!$this->ninjaone_enabled) {
            return false;
        }
        
        $ninjaOneService = app(\App\Services\NinjaOneService::class);
        
        try {
            // Si no tenemos un ID de dispositivo en NinjaOne, intentamos encontrarlo por nombre
            if (!$this->ninjaone_device_id && $this->name) {
                $deviceId = $ninjaOneService->findDeviceIdByName($this->name);
                if ($deviceId) {
                    $this->ninjaone_device_id = $deviceId;
                    $this->save();
                }
            }
            
            // Si todavía no tenemos un ID, no podemos continuar
            if (!$this->ninjaone_device_id) {
                \Illuminate\Support\Facades\Log::warning('No se pudo sincronizar el dispositivo porque no se encontró en NinjaOne', [
                    'device_id' => $this->id,
                    'device_name' => $this->name
                ]);
                return false;
            }
            
            // Obtener información del dispositivo
            $ninjaOneDevice = $ninjaOneService->getDevice($this->ninjaone_device_id);
            if (!$ninjaOneDevice) {
                return false;
            }
            
            // Actualizar información
            $this->ninjaone_system_name = $ninjaOneDevice['systemName'] ?? null;
            $this->ninjaone_hostname = $ninjaOneDevice['hostname'] ?? null;
            $this->ninjaone_serial_number = $ninjaOneDevice['serialNumber'] ?? null;
            $this->ninjaone_asset_tag = $ninjaOneDevice['assetTag'] ?? null;
            $this->ninjaone_online = $ninjaOneDevice['online'] ?? false;
            $this->ninjaone_os = $ninjaOneDevice['operatingSystem'] ?? null;
            $this->ninjaone_last_seen = isset($ninjaOneDevice['lastSeenUtc']) ? 
                \Carbon\Carbon::parse($ninjaOneDevice['lastSeenUtc']) : null;
            $this->ninjaone_metadata = $ninjaOneDevice;
            
            // Obtener estado de salud
            $healthStatus = $ninjaOneService->getDeviceHealthStatus($this->ninjaone_device_id);
            if ($healthStatus) {
                $this->ninjaone_status = $healthStatus['status'] ?? 'unknown';
                $this->ninjaone_issues_count = $healthStatus['issuesCount'] ?? 0;
                $this->ninjaone_needs_attention = ($healthStatus['status'] ?? 'unknown') !== 'healthy';
            }
            
            $this->save();
            return true;
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error sincronizando dispositivo con NinjaOne', [
                'device_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
    
    /**
     * Check if the device needs attention based on NinjaOne status
     */
    public function needsAttention(): bool
    {
        if (!$this->ninjaone_enabled) {
            return false;
        }
        
        return $this->ninjaone_needs_attention || $this->hasActiveNinjaoneAlerts();
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
