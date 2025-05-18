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

        $apartment = Apartment::findOrFail($request->apartment_id);

        // Verificar que los tenants pertenecen al apartment
        $validTenantIds = $apartment->tenants()
            ->whereIn('id', $request->tenant_ids)
            ->pluck('id');

        // Registrar compartidos con el dueño original
        $device->sharedWith()->attach($validTenantIds, [
            'owner_tenant_id' => $request->tenant_id 
        ]);

        return response()->json([
            'message' => 'Dispositivo compartido exitosamente',
            'device' => $device->load(['owner', 'sharedWith'])
        ]);
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

            'tenant_id' => 'nullable|exists:tenants,id',

            'tenants' => 'nullable|array', // Obligar asignación mínima a 1 inquilino
            'tenants.*' => 'exists:tenants,id',
        ]);

        return DB::transaction(function () use ($request) {
            // Procesar NameDevice
            $name_device_id = $this->processNameDevice($request);

            // Procesar Brand
            $brand_id = $this->processBrand($request);

            // Procesar Model
            $model_id = $this->processModel($request);

            // Procesar System
            $system_id = $this->processSystem($request);

            $device = Device::create([
                'name' => $request->name,
                'brand_id' => $brand_id,
                'model_id' => $model_id,
                'system_id' => $system_id,
                'name_device_id' => $name_device_id
            ]);


            $device->tenants()->attach($request->tenant_id);

            return response()->json([
                'device' => Device::with(['brand', 'model', 'system', 'name_device'])->find($device->id)
            ]);
        });
    }

    public function update(Request $request, Device $device)
    {
        $request->validate([
            'name' => 'nullable|required|string|max:255',
            'brand_id' => 'nullable|exists:brands,id',
            'model_id' => 'nullable|exists:models,id',
            'system_id' => 'nullable|exists:systems,id',
            'name_device_id' => 'nullable|exists:name_devices,id',
            'new_brand' => 'nullable|string|max:255',
            'new_model' => 'nullable|string|max:255',
            'new_system' => 'nullable|string|max:255',
            'new_name_device' => 'nullable|string|max:255'
        ]);

        return DB::transaction(function () use ($request, $device) {
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

            return response()->json([
                'device' => Device::with(['brand', 'model', 'system', 'name_device'])->find($device->id)
            ]);
        });
    }

    public function destroy(Device $device)
    {
        DB::transaction(function () use ($device) {
            $device->apartments()->detach();
            $device->tenants()->detach();
            $device->delete();
        });

        return response()->json(['message' => 'Dispositivo eliminado correctamente.']);
    }

    private function processNameDevice(Request $request)
    {
        if ($request->filled('new_name_device')) {
            return NameDevice::firstOrCreate(['name' => $request->new_name_device])->id;
        }
        return $request->name_device_id;
    }

    private function processBrand(Request $request)
    {
        if ($request->filled('new_brand')) {
            return Brand::firstOrCreate(['name' => $request->new_brand])->id;
        }
        return $request->brand_id;
    }

    private function processModel(Request $request)
    {
        if ($request->filled('new_model')) {
            return DeviceModel::firstOrCreate([
                'name' => $request->new_model,
                'brand_id' => $this->processBrand($request)
            ])->id;
        }
        return $request->model_id;
    }

    private function processSystem(Request $request)
    {
        if ($request->filled('new_system')) {
            return System::firstOrCreate([
                'name' => $request->new_system,
                'model_id' => $this->processModel($request)
            ])->id;
        }
        return $request->system_id;
    }
}
