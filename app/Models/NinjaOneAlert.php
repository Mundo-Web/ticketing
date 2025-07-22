<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NinjaOneAlert extends Model
{
    use HasFactory;

    protected $table = 'ninja_one_alerts';

    protected $fillable = [
        'ninjaone_alert_id',
        'device_id',
        'alert_type',
        'severity',
        'status',
        'title',
        'description',
        'raw_data',
        'acknowledged_at',
        'ticket_created',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'acknowledged_at' => 'datetime',
        'ticket_created' => 'boolean',
    ];

    /**
     * Get the device associated with this alert
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Get the ticket created from this alert (if any)
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Check if alert is critical
     */
    public function isCritical(): bool
    {
        return in_array($this->severity, ['critical', 'high']);
    }

    /**
     * Check if alert is resolved
     */
    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }

    /**
     * Check if alert can be acknowledged
     */
    public function canBeAcknowledged(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Check if alert can be resolved
     */
    public function canBeResolved(): bool
    {
        return in_array($this->status, ['open', 'acknowledged']);
    }

    /**
     * Acknowledge the alert
     */
    public function acknowledge(): bool
    {
        if (!$this->canBeAcknowledged()) {
            return false;
        }

        return $this->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
        ]);
    }

    /**
     * Resolve the alert
     */
    public function resolve(): bool
    {
        if (!$this->canBeResolved()) {
            return false;
        }

        return $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);
    }

    /**
     * Get severity color class for UI
     */
    public function getSeverityColorAttribute(): string
    {
        return match($this->severity) {
            'info' => 'bg-blue-100 text-blue-800',
            'warning' => 'bg-yellow-100 text-yellow-800', 
            'critical' => 'bg-red-100 text-red-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    /**
     * Get status color class for UI
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'open' => 'bg-red-100 text-red-800',
            'acknowledged' => 'bg-yellow-100 text-yellow-800',
            'resolved' => 'bg-green-100 text-green-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }
}
