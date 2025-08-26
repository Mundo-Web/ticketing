<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action_type',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'session_id',
        'description',
        'route',
        'method',
        'request_data',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'request_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con el usuario que realizó la acción
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtener el modelo relacionado de forma polimórfica
     */
    public function auditable()
    {
        if ($this->model_type && $this->model_id) {
            return $this->model_type::find($this->model_id);
        }
        return null;
    }

    /**
     * Scope para filtrar por usuario
     */
    public function scopeByUser(Builder $query, $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para filtrar por tipo de acción
     */
    public function scopeByAction(Builder $query, $actionType): Builder
    {
        return $query->where('action_type', $actionType);
    }

    /**
     * Scope para filtrar por modelo
     */
    public function scopeByModel(Builder $query, $modelType): Builder
    {
        return $query->where('model_type', $modelType);
    }

    /**
     * Scope para filtrar por rango de fechas
     */
    public function scopeByDateRange(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('created_at', [
            Carbon::parse($startDate)->startOfDay(),
            Carbon::parse($endDate)->endOfDay()
        ]);
    }

    /**
     * Scope para filtrar por IP
     */
    public function scopeByIp(Builder $query, $ipAddress): Builder
    {
        return $query->where('ip_address', $ipAddress);
    }

    /**
     * Scope para filtrar por sesión
     */
    public function scopeBySession(Builder $query, $sessionId): Builder
    {
        return $query->where('session_id', $sessionId);
    }

    /**
     * Obtener logs de hoy
     */
    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('created_at', Carbon::today());
    }

    /**
     * Obtener logs de la última semana
     */
    public function scopeLastWeek(Builder $query): Builder
    {
        return $query->where('created_at', '>=', Carbon::now()->subWeek());
    }

    /**
     * Obtener logs del último mes
     */
    public function scopeLastMonth(Builder $query): Builder
    {
        return $query->where('created_at', '>=', Carbon::now()->subMonth());
    }

    /**
     * Método estático para crear un log de auditoría
     */
    public static function createLog(array $data): self
    {
        return self::create(array_merge($data, [
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'session_id' => session()->getId(),
            'route' => request()->route()?->getName(),
            'method' => request()->method(),
        ]));
    }

    /**
     * Obtener descripción legible de la acción
     */
    public function getReadableActionAttribute(): string
    {
        $actions = [
            'created' => 'Creado',
            'updated' => 'Actualizado',
            'deleted' => 'Eliminado',
            'login' => 'Inicio de sesión',
            'logout' => 'Cierre de sesión',
            'viewed' => 'Visualizado',
            'exported' => 'Exportado',
            'assigned' => 'Asignado',
            'unassigned' => 'Desasignado',
            'completed' => 'Completado',
            'cancelled' => 'Cancelado',
        ];

        return $actions[$this->action_type] ?? ucfirst($this->action_type);
    }

    /**
     * Get readable model name with identifier
     */
    public function getReadableModelAttribute(): string
    {
        if (!$this->model_type) {
            return 'System';
        }

        $models = [
            'App\\Models\\Ticket' => 'Ticket',
            'App\\Models\\User' => 'User',
            'App\\Models\\Building' => 'Building',
            'App\\Models\\Device' => 'Device',
            'App\\Models\\Appointment' => 'Appointment',
            'App\\Models\\Technical' => 'Technician',
            'App\\Models\\Customer' => 'Customer',
            'App\\Models\\Owner' => 'Owner',
            'App\\Models\\Doorman' => 'Doorman',
            'App\\Models\\Tenant' => 'Tenant',
            'App\\Models\\Apartment' => 'Apartment',
            'App\\Models\\Brand' => 'Brand',
            'App\\Models\\DeviceModel' => 'Device Model',
            'App\\Models\\System' => 'System',
        ];

        $modelName = $models[$this->model_type] ?? class_basename($this->model_type);
        
        // Try to get the actual model instance to show its identifier
        try {
            $modelInstance = $this->auditable();
            if ($modelInstance && method_exists($modelInstance, 'getAuditIdentifier')) {
                $identifier = $modelInstance->getAuditIdentifier();
                return "{$modelName}: {$identifier}";
            }
        } catch (\Exception $e) {
            // If we can't get the model instance, just return the model name
        }
        
        return $modelName . ($this->model_id ? " (ID: {$this->model_id})" : '');
    }
}
