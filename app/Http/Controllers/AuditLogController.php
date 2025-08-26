<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * Constructor - Verificar permisos de super-admin
     */
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('role:super-admin');
    }

    /**
     * Mostrar el dashboard de auditoría
     */
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search',
            'user_id',
            'action_type',
            'model_type',
            'date_from',
            'date_to',
            'ip_address',
            'per_page'
        ]);

        $query = AuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        // Aplicar filtros
        $this->applyFilters($query, $filters);

        $perPage = $request->get('per_page', 25);
        $auditLogs = $query->paginate($perPage)->withQueryString();

        // Obtener datos para los filtros
        $filterData = $this->getFilterData();

        return Inertia::render('AuditLogs/Index', [
            'auditLogs' => $auditLogs,
            'filters' => $filters,
            'filterData' => $filterData,
            'stats' => $this->getAuditStats(),
        ]);
    }

    /**
     * Mostrar detalles de un log específico
     */
    public function show(AuditLog $auditLog): Response
    {
        $auditLog->load('user:id,name,email');
        
        return Inertia::render('AuditLogs/Show', [
            'auditLog' => $auditLog,
        ]);
    }

    /**
     * Obtener logs de auditoría vía API (para actualizaciones en tiempo real)
     */
    public function api(Request $request): JsonResponse
    {
        $filters = $request->only([
            'search',
            'user_id',
            'action_type',
            'model_type',
            'date_from',
            'date_to',
            'ip_address',
            'per_page'
        ]);

        $query = AuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        $this->applyFilters($query, $filters);

        $perPage = $request->get('per_page', 25);
        $auditLogs = $query->paginate($perPage);

        return response()->json($auditLogs);
    }

    /**
     * Exportar logs de auditoría a CSV
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = $request->only([
            'search',
            'user_id',
            'action_type',
            'model_type',
            'date_from',
            'date_to',
            'ip_address'
        ]);

        $query = AuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc');

        $this->applyFilters($query, $filters);

        $fileName = 'audit_logs_' . now()->format('Y-m-d_H-i-s') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            
            // Encabezados CSV
            fputcsv($handle, [
                'ID',
                'Usuario',
                'Email Usuario',
                'Acción',
                'Modelo',
                'ID Modelo',
                'Descripción',
                'IP',
                'Navegador',
                'Ruta',
                'Método HTTP',
                'Fecha/Hora',
                'Valores Anteriores',
                'Valores Nuevos',
                'Datos Petición'
            ]);

            // Procesar en chunks para evitar problemas de memoria
            $query->chunk(1000, function ($auditLogs) use ($handle) {
                foreach ($auditLogs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->user?->name ?? 'Sistema',
                        $log->user?->email ?? 'N/A',
                        $log->readable_action,
                        $log->readable_model,
                        $log->model_id,
                        $log->description,
                        $log->ip_address,
                        $log->user_agent,
                        $log->route,
                        $log->method,
                        $log->created_at->format('Y-m-d H:i:s'),
                        $log->old_values ? json_encode($log->old_values) : '',
                        $log->new_values ? json_encode($log->new_values) : '',
                        $log->request_data ? json_encode($log->request_data) : ''
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    /**
     * Obtener estadísticas de auditoría
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->getAuditStats());
    }

    /**
     * Limpiar logs antiguos (solo super-admin)
     */
    public function cleanup(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'required|integer|min:30|max:365'
        ]);

        $days = $request->get('days', 90);
        $cutoffDate = Carbon::now()->subDays($days);
        
        $deletedCount = AuditLog::where('created_at', '<', $cutoffDate)->delete();

        // Registrar la acción de limpieza
        AuditLog::createLog([
            'user_id' => auth()->id(),
            'action_type' => 'cleanup',
            'description' => "Limpieza de logs de auditoría: {$deletedCount} registros eliminados (más de {$days} días)",
        ]);

        return response()->json([
            'message' => "Se eliminaron {$deletedCount} registros de auditoría anteriores a {$days} días.",
            'deleted_count' => $deletedCount
        ]);
    }

    /**
     * Aplicar filtros a la consulta
     */
    private function applyFilters($query, array $filters)
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action_type', 'like', "%{$search}%")
                  ->orWhere('route', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['action_type'])) {
            $query->where('action_type', $filters['action_type']);
        }

        if (!empty($filters['model_type'])) {
            $query->where('model_type', $filters['model_type']);
        }

        if (!empty($filters['ip_address'])) {
            $query->where('ip_address', $filters['ip_address']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }
    }

    /**
     * Obtener datos para los filtros
     */
    private function getFilterData(): array
    {
        return [
            'users' => User::select('id', 'name', 'email')
                          ->whereHas('auditLogs')
                          ->orderBy('name')
                          ->get(),
            'actionTypes' => AuditLog::select('action_type')
                                   ->distinct()
                                   ->orderBy('action_type')
                                   ->pluck('action_type'),
            'modelTypes' => $this->getFriendlyModelTypes(),
            'ipAddresses' => AuditLog::select('ip_address')
                                   ->whereNotNull('ip_address')
                                   ->distinct()
                                   ->orderBy('ip_address')
                                   ->limit(50)
                                   ->pluck('ip_address'),
        ];
    }

    /**
     * Get model types with friendly names in English
     */
    private function getFriendlyModelTypes(): array
    {
        $modelTypes = AuditLog::select('model_type')
                             ->whereNotNull('model_type')
                             ->distinct()
                             ->orderBy('model_type')
                             ->pluck('model_type');

        $friendlyNames = [
            'App\\Models\\Ticket' => 'Ticket',
            'App\\Models\\Building' => 'Building',
            'App\\Models\\Technical' => 'Technician',
            'App\\Models\\Device' => 'Device',
            'App\\Models\\Appointment' => 'Appointment',
            'App\\Models\\Tenant' => 'Tenant',
            'App\\Models\\User' => 'User',
            'App\\Models\\Apartment' => 'Apartment',
            'App\\Models\\Brand' => 'Brand',
            'App\\Models\\DeviceModel' => 'Device Model',
            'App\\Models\\System' => 'System',
            'App\\Models\\Owner' => 'Owner',
            'App\\Models\\Doorman' => 'Doorman',
        ];

        $result = [];
        foreach ($modelTypes as $modelType) {
            $friendlyName = $friendlyNames[$modelType] ?? class_basename($modelType);
            $result[] = [
                'value' => $modelType,
                'label' => $friendlyName
            ];
        }

        return $result;
    }

    /**
     * Obtener estadísticas de auditoría
     */
    private function getAuditStats(): array
    {
        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();

        return [
            'total_logs' => AuditLog::count(),
            'today_logs' => AuditLog::whereDate('created_at', $today)->count(),
            'week_logs' => AuditLog::where('created_at', '>=', $thisWeek)->count(),
            'month_logs' => AuditLog::where('created_at', '>=', $thisMonth)->count(),
            'unique_users_today' => AuditLog::whereDate('created_at', $today)
                                          ->distinct('user_id')
                                          ->count('user_id'),
            'top_actions' => AuditLog::select('action_type', DB::raw('count(*) as count'))
                                   ->where('created_at', '>=', $thisWeek)
                                   ->groupBy('action_type')
                                   ->orderBy('count', 'desc')
                                   ->limit(5)
                                   ->get(),
            'top_users' => AuditLog::select('user_id', DB::raw('count(*) as count'))
                                 ->with('user:id,name')
                                 ->where('created_at', '>=', $thisWeek)
                                 ->whereNotNull('user_id')
                                 ->groupBy('user_id')
                                 ->orderBy('count', 'desc')
                                 ->limit(5)
                                 ->get(),
        ];
    }
}
