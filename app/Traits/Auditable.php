<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    /**
     * Boot the auditable trait for a model.
     */
    public static function bootAuditable()
    {
        static::created(function (Model $model) {
            $model->auditAction('created', null, $model->getAttributes());
        });

        static::updated(function (Model $model) {
            $original = $model->getOriginal();
            $changes = $model->getChanges();
            
            // Solo auditar si hay cambios reales
            if (!empty($changes)) {
                $model->auditAction('updated', $original, $changes);
            }
        });

        static::deleted(function (Model $model) {
            $model->auditAction('deleted', $model->getAttributes(), null);
        });
    }

    /**
     * Crear un registro de auditoría para una acción específica
     */
    public function auditAction(string $action, ?array $oldValues = null, ?array $newValues = null, ?string $description = null)
    {
        // Filtrar campos sensibles que no deben ser auditados
        $excludedFields = $this->getAuditExcluded();
        
        if ($oldValues) {
            $oldValues = $this->filterAuditData($oldValues, $excludedFields);
        }
        
        if ($newValues) {
            $newValues = $this->filterAuditData($newValues, $excludedFields);
        }

        AuditLog::createLog([
            'user_id' => Auth::id(),
            'action_type' => $action,
            'model_type' => get_class($this),
            'model_id' => $this->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'description' => $description ?? $this->getAuditDescription($action),
        ]);
    }

    /**
     * Obtener campos que deben ser excluidos de la auditoría
     */
    protected function getAuditExcluded(): array
    {
        return array_merge([
            'password',
            'remember_token',
            'email_verified_at',
            'created_at',
            'updated_at',
        ], $this->auditExcluded ?? []);
    }

    /**
     * Filtrar datos de auditoría removiendo campos excluidos
     */
    protected function filterAuditData(array $data, array $excluded): array
    {
        return array_diff_key($data, array_flip($excluded));
    }

    /**
     * Get custom description for audit action
     */
    protected function getAuditDescription(string $action): ?string
    {
        $modelName = $this->getFriendlyModelName();
        $identifier = $this->getAuditIdentifier();
        
        switch ($action) {
            case 'created':
                return "Created {$modelName}: {$identifier}";
            case 'updated':
                return $this->getDetailedUpdateDescription($modelName, $identifier);
            case 'deleted':
                return "Deleted {$modelName}: {$identifier}";
            default:
                return null;
        }
    }

    /**
     * Get detailed description for update actions
     */
    protected function getDetailedUpdateDescription(string $modelName, string $identifier): string
    {
        $changes = $this->getChanges();
        $changedFields = [];
        
        foreach ($changes as $field => $newValue) {
            if ($field === 'updated_at') continue;
            
            $friendlyField = $this->getFriendlyFieldName($field);
            $originalValue = $this->getOriginal($field);
            
            if (is_null($originalValue)) {
                $changedFields[] = "set {$friendlyField} to '{$newValue}'";
            } elseif (is_null($newValue)) {
                $changedFields[] = "cleared {$friendlyField}";
            } else {
                $changedFields[] = "changed {$friendlyField} from '{$originalValue}' to '{$newValue}'";
            }
        }
        
        if (empty($changedFields)) {
            return "Updated {$modelName}: {$identifier}";
        }
        
        $changesText = implode(', ', $changedFields);
        return "Updated {$modelName}: {$identifier} - {$changesText}";
    }

    /**
     * Get friendly field names
     */
    protected function getFriendlyFieldName(string $field): string
    {
        $fieldNames = [
            'name' => 'name',
            'email' => 'email',
            'status' => 'status',
            'description' => 'description',
            'address' => 'address',
            'phone' => 'phone',
            'title' => 'title',
            'priority' => 'priority',
            'assigned_to' => 'assigned technician',
            'building_id' => 'building',
            'tenant_id' => 'tenant',
            'device_id' => 'device',
            'appointment_date' => 'appointment date',
            'managing_company' => 'managing company',
            'location_link' => 'location link',
            'image' => 'image',
        ];
        
        return $fieldNames[$field] ?? str_replace('_', ' ', $field);
    }

    /**
     * Get friendly model name in English
     */
    protected function getFriendlyModelName(): string
    {
        $modelClass = class_basename($this);
        
        $friendlyNames = [
            'Ticket' => 'Ticket',
            'Building' => 'Building',
            'Technical' => 'Technician',
            'Device' => 'Device',
            'Appointment' => 'Appointment',
            'Tenant' => 'Tenant',
            'User' => 'User',
            'Apartment' => 'Apartment',
            'Brand' => 'Brand',
            'DeviceModel' => 'Device Model',
            'System' => 'System',
            'Owner' => 'Owner',
            'Doorman' => 'Doorman',
        ];

        return $friendlyNames[$modelClass] ?? $modelClass;
    }

    /**
     * Get readable identifier for the model in audit
     */
    protected function getAuditIdentifier(): string
    {
        // Intentar usar campos comunes para identificar el modelo
        $identifierFields = ['name', 'title', 'email', 'code'];
        
        foreach ($identifierFields as $field) {
            if ($this->getAttribute($field)) {
                return $this->getAttribute($field);
            }
        }
        
        return "ID: {$this->getKey()}";
    }

    /**
     * Auditar una acción personalizada
     */
    public function auditCustomAction(string $action, ?string $description = null, ?array $additionalData = null)
    {
        AuditLog::createLog([
            'user_id' => Auth::id(),
            'action_type' => $action,
            'model_type' => get_class($this),
            'model_id' => $this->getKey(),
            'old_values' => null,
            'new_values' => $additionalData,
            'description' => $description ?? $this->getAuditDescription($action),
        ]);
    }

    /**
     * Obtener todos los logs de auditoría para este modelo
     */
    public function auditLogs()
    {
        return AuditLog::where('model_type', get_class($this))
                      ->where('model_id', $this->getKey())
                      ->orderBy('created_at', 'desc');
    }

    /**
     * Verificar si el modelo debe ser auditado
     */
    protected function shouldAudit(): bool
    {
        // Permitir deshabilitar auditoría temporalmente
        if (property_exists($this, 'auditingDisabled') && $this->auditingDisabled) {
            return false;
        }

        // No auditar si no hay usuario autenticado (para seeders, comandos, etc.)
        if (!Auth::check() && !$this->auditWithoutUser()) {
            return false;
        }

        return true;
    }

    /**
     * Determinar si se debe auditar sin usuario autenticado
     */
    protected function auditWithoutUser(): bool
    {
        return property_exists($this, 'auditWithoutUser') ? $this->auditWithoutUser : false;
    }

    /**
     * Deshabilitar auditoría temporalmente
     */
    public function disableAuditing()
    {
        $this->auditingDisabled = true;
        return $this;
    }

    /**
     * Habilitar auditoría
     */
    public function enableAuditing()
    {
        $this->auditingDisabled = false;
        return $this;
    }
}