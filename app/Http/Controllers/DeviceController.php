<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Tenant;
use App\Models\Apartment;
use App\Models\NameDevice;
use App\Models\Brand;
use App\Models\DeviceModel;
use App\Models\System;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeviceController extends Controller
{
    public function share(Request $request, Device $device)
    {
        $request->validate([
            'tenant_ids' => 'required|array',
            'tenant_ids.*' => 'exists:tenants,id',
            'tenant_id' => 'required|exists:tenants,id',
            'apartment_id' => 'required|exists:apartments,id',
        ]);

        DB::beginTransaction();

        try {
            // Verificar que los inquilinos pertenecen al apartamento
            $validTenantIds = Tenant::whereIn('id', $request->tenant_ids)
                ->where('apartment_id', $request->apartment_id)
                ->pluck('id')
                ->toArray();

            if (empty($validTenantIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron inquilinos válidos para compartir'
                ], 400);
            }

            // Sincronizar los inquilinos con los que se comparte
            $syncData = [];
            foreach ($validTenantIds as $tenantId) {
                $syncData[$tenantId] = ['owner_tenant_id' => $request->tenant_id];
            }

            $device->sharedWith()->syncWithoutDetaching($syncData);

            // Cargar todas las relaciones necesarias
            $device->load([
                'brand',
                'model',
                'system',
                'name_device',
                'sharedWith' => function($query) {
                    $query->select('tenants.id', 'tenants.name', 'tenants.email');
                },
                'tenants' => function($query) {
                    $query->select('tenants.id', 'tenants.name', 'tenants.email');
                }
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo compartido exitosamente',
                'device' => $device,
                'sharedDevices' => $device->sharedWith
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al compartir el dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'apartment_id' => 'nullable|exists:apartments,id',
            'brand_id' => 'nullable|exists:brands,id',
            'model_id' => 'nullable|exists:models,id',
            'system_id' => 'nullable|exists:systems,id',
            'name_device_id' => 'nullable|exists:name_devices,id',
            'new_brand' => 'nullable|string|max:255',
            'new_model' => 'nullable|string|max:255',
            'new_system' => 'nullable|string|max:255',
            'new_name_device' => 'nullable|string|max:255',
            'tenant_id' => 'required|exists:tenants,id',
            'tenants' => 'sometimes|array',
            'tenants.*' => 'exists:tenants,id',
        ]);

        DB::beginTransaction();

        try {
            // Procesar NameDevice
            $name_device_id = $this->processNameDevice($request);

            // Procesar Brand
            $brand_id = $this->processBrand($request);

            // Procesar Model
            $model_id = $this->processModel($request);

            // Procesar System
            $system_id = $this->processSystem($request);

            // Crear el dispositivo
            $device = Device::create([
                'name' => $request->name,
                'brand_id' => $brand_id,
                'model_id' => $model_id,
                'system_id' => $system_id,
                'name_device_id' => $name_device_id
            ]);

            // Asignar inquilinos
            $device->tenants()->attach($request->tenant_id);
          /*  if (!empty($request->tenants)) {
                $device->tenants()->attach($request->tenants);
            }*/
            if ($request->has('tenants')) {
                $shareData = collect($request->tenants)->mapWithKeys(function($tenantId) use ($request) {
                    return [$tenantId => [
                        'owner_tenant_id' => $request->tenant_id
                    ]];
                });
                $device->sharedWith()->syncWithoutDetaching($shareData);
           
            }

            // Cargar relaciones para la respuesta
            $device->load(['tenants', 'sharedWith', 'brand', 'model', 'system', 'name_device']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo creado exitosamente',
                'device' => $device
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Device $device)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'brand_id' => 'nullable|exists:brands,id',
            'model_id' => 'nullable|exists:models,id',
            'system_id' => 'nullable|exists:systems,id',
            'name_device_id' => 'nullable|exists:name_devices,id',
            'new_brand' => 'nullable|string|max:255',
            'new_model' => 'nullable|string|max:255',
            'new_system' => 'nullable|string|max:255',
            'new_name_device' => 'nullable|string|max:255',
            'tenants' => 'nullable|array',
            'tenants.*' => 'exists:tenants,id',
        ]);

        DB::beginTransaction();

        try {
            $name_device_id = $this->processNameDevice($request);
            $brand_id = $this->processBrand($request);
            $model_id = $this->processModel($request);
            $system_id = $this->processSystem($request);

            $device->update([
                'name' => $request->name,
                'brand_id' => $brand_id,
                'model_id' => $model_id,
                'system_id' => $system_id,
                'name_device_id' => $name_device_id
            ]);

            // Sincronizar inquilinos si se proporcionan
            if ($request->has('tenants')) {
                $device->tenants()->sync($request->tenants);
            }

            // Cargar relaciones para la respuesta
            $device->load(['brand', 'model', 'system', 'name_device', 'tenants']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo actualizado exitosamente',
                'device' => $device
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Device $device)
    {
        DB::beginTransaction();

        try {
            // Eliminar relaciones primero
            $device->apartments()->detach();
            $device->tenants()->detach();
            $device->sharedWith()->detach();

            // Eliminar el dispositivo
            $device->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo eliminado correctamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el dispositivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function processNameDevice(Request $request)
    {
        if ($request->filled('new_name_device')) {
            $nameDevice = NameDevice::firstOrCreate(['name' => $request->new_name_device]);
            return $nameDevice->id;
        }
        return $request->name_device_id;
    }

    private function processBrand(Request $request)
    {
        if ($request->filled('new_brand')) {
            $brand = Brand::firstOrCreate(['name' => $request->new_brand]);
            return $brand->id;
        }
        return $request->brand_id;
    }

    private function processModel(Request $request)
    {
        if ($request->filled('new_model')) {
            $model = DeviceModel::firstOrCreate([
                'name' => $request->new_model,
                'brand_id' => $this->processBrand($request)
            ]);
            return $model->id;
        }
        return $request->model_id;
    }

    private function processSystem(Request $request)
    {
        if ($request->filled('new_system')) {
            $system = System::firstOrCreate([
                'name' => $request->new_system,
                'model_id' => $this->processModel($request)
            ]);
            return $system->id;
        }
        return $request->system_id;
    }
}