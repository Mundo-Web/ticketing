<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PushToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'push_token',
        'platform',
        'device_name',
        'device_type',
        'is_active',
        'token_type',        // 'expo' o 'fcm'
        'app_ownership',     // 'expo' o 'standalone'
        'is_standalone',     // boolean
        'execution_environment',  // string
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_standalone' => 'boolean',
    ];

    /**
     * Get the tenant that owns this push token.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope to get only active tokens
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get tokens for a specific tenant
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get only Expo tokens
     */
    public function scopeExpo($query)
    {
        return $query->where('token_type', 'expo');
    }

    /**
     * Scope to get only FCM tokens
     */
    public function scopeFcm($query)
    {
        return $query->where('token_type', 'fcm');
    }

    /**
     * Check if token is FCM type
     */
    public function isFcm(): bool
    {
        return $this->token_type === 'fcm';
    }

    /**
     * Check if token is Expo type
     */
    public function isExpo(): bool
    {
        return $this->token_type === 'expo';
    }
}