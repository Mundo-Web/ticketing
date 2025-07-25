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
            'tenant_ids' => 'array',
            'tenant_ids.*' => 'exists:tenants,id',
            'tenant_id' => 'required|exists:tenants,id',
            'apartment_id' => 'required|exists:apartments,id',
            'unshare_tenant_ids' => 'array',
            'unshare_tenant_ids.*' => 'exists:tenants,id',
        ]);

        DB::beginTransaction();

        try {
            // Compartir con nuevos inquilinos
            if ($request->has('tenant_ids') && !empty($request->tenant_ids)) {
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
            }

            // Descompartir con inquilinos
            if ($request->has('unshare_tenant_ids') && !empty($request->unshare_tenant_ids)) {
                // Verificar que los inquilinos pertenecen al apartamento
                $validUnshareIds = Tenant::whereIn('id', $request->unshare_tenant_ids)
                    ->where('apartment_id', $request->apartment_id)
                    ->pluck('id')
                    ->toArray();

                if (!empty($validUnshareIds)) {
                    foreach ($validUnshareIds as $tenantId) {
                        $device->sharedWith()->detach($tenantId);
                    }
                }
            }

            // Cargar todas las relaciones necesarias
            $device->load([
                'brand',
                'model',
                'system',
                'name_device',
                'sharedWith' => function ($query) {
                    $query->select('tenants.id', 'tenants.name', 'tenants.email', 'tenants.photo');
                },
                'tenants' => function ($query) {
                    $query->select('tenants.id', 'tenants.name', 'tenants.email', 'tenants.photo');
                }
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Dispositivo actualizado exitosamente',
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
            'ubicacion' => 'nullable|string',
            'icon_id' => 'nullable|string|max:255',
            'is_in_ninjaone' => 'nullable|boolean',
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
                'name_device_id' => $name_device_id,
                'ubicacion' => $request->ubicacion,
                'icon_id' => $request->icon_id,
                'is_in_ninjaone' => $request->has('is_in_ninjaone') ? (bool)$request->is_in_ninjaone : false
            ]);

            // Attach main tenant
            $device->tenants()->attach($request->tenant_id);

            // Handle shared tenants
            if ($request->has('tenants') && !empty($request->tenants)) {
                $validTenants = collect($request->tenants)
                    ->unique()
                    ->reject(function ($id) use ($request) {
                        return $id == $request->tenant_id;
                    })
                    ->values()
                    ->toArray();

                if (!empty($validTenants)) {
                    // Create sharing data for all valid tenants
                    $shareData = [];
                    foreach ($validTenants as $tenantId) {
                        $shareData[$tenantId] = ['owner_tenant_id' => $request->tenant_id];
                    }

                    // Attach all shared tenants at once
                    $device->sharedWith()->attach($shareData);
                }
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
            'ubicacion' => 'nullable|string',
            'icon_id' => 'nullable|string|max:255',
            'is_in_ninjaone' => 'nullable|boolean',
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
                'name_device_id' => $name_device_id,
                'ubicacion' => $request->ubicacion,
                'icon_id' => $request->icon_id,
                'is_in_ninjaone' => $request->has('is_in_ninjaone') ? $request->is_in_ninjaone : $device->is_in_ninjaone
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

    // Remove device from tenant (remove relationship, not the device itself)
    public function removeFromTenant(Request $request, Device $device)
    {
        try {
            $tenantId = $request->input('tenant_id');
            
            if (!$tenantId) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Tenant ID is required'
                ], 400);
            }
            
            // Remove from device_tenant pivot table
            DB::table('device_tenant')
                ->where('device_id', $device->id)
                ->where('tenant_id', $tenantId)
                ->delete();
            
            // Also remove from share_device_tenant table if exists
            DB::table('share_device_tenant')
                ->where('device_id', $device->id)
                ->where(function($query) use ($tenantId) {
                    $query->where('owner_tenant_id', $tenantId)
                          ->orWhere('shared_with_tenant_id', $tenantId);
                })
                ->delete();
            
            return response()->json([
                'success' => true, 
                'message' => 'Device removed from tenant successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Error removing device from tenant: ' . $e->getMessage()
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
            $brand = Brand::firstOrCreate(['name' => $request->new_brand,  'name_device_id' => $this->processNameDevice($request)]);
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




    // BrandController.php
    public function destroyBrand(Request $request, $id)
    {
        try {
            $brand = Brand::findOrFail($id);
            $force = $request->input('force', false);
            
            // Check if brand is in use
            $affectedDevices = Device::where('brand_id', $id)->get();
            $devicesCount = $affectedDevices->count();
            
            if ($devicesCount > 0 && !$force) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Cannot delete brand because it is being used by ' . $devicesCount . ' device(s)',
                    'devices_count' => $devicesCount,
                    'can_force' => true
                ], 422);
            }
            
            // If forcing deletion, delete associated devices in cascade
            if ($force && $devicesCount > 0) {
                Device::where('brand_id', $id)->delete();
            }
            
            $brand->delete();
            return response()->json([
                'success' => true, 
                'message' => $force ? 'Brand forcefully deleted and ' . $devicesCount . ' associated device(s) removed' : 'Brand deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error deleting brand: ' . $e->getMessage()], 500);
        }
    }

    // ModelController.php
    public function destroyModel(Request $request, $id)
    {
        try {
            $model = DeviceModel::findOrFail($id);
            $force = $request->input('force', false);
            
            // Check if model is in use
            $affectedDevices = Device::where('model_id', $id)->get();
            $devicesCount = $affectedDevices->count();
            
            if ($devicesCount > 0 && !$force) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Cannot delete model because it is being used by ' . $devicesCount . ' device(s)',
                    'devices_count' => $devicesCount,
                    'can_force' => true
                ], 422);
            }
            
            // If forcing deletion, delete associated devices in cascade
            if ($force && $devicesCount > 0) {
                Device::where('model_id', $id)->delete();
            }
            
            $model->delete();
            return response()->json([
                'success' => true, 
                'message' => $force ? 'Model forcefully deleted and ' . $devicesCount . ' associated device(s) removed' : 'Model deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error deleting model: ' . $e->getMessage()], 500);
        }
    }

    // SystemController.php
    public function destroySystem(Request $request, $id)
    {
        try {
            $system = System::findOrFail($id);
            $force = $request->input('force', false);
            
            // Check if system is in use
            $affectedDevices = Device::where('system_id', $id)->get();
            $devicesCount = $affectedDevices->count();
            
            if ($devicesCount > 0 && !$force) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Cannot delete system because it is being used by ' . $devicesCount . ' device(s)',
                    'devices_count' => $devicesCount,
                    'can_force' => true
                ], 422);
            }
            
            // If forcing deletion, delete associated devices in cascade
            if ($force && $devicesCount > 0) {
                Device::where('system_id', $id)->delete();
            }
            
            $system->delete();
            return response()->json([
                'success' => true, 
                'message' => $force ? 'System forcefully deleted and ' . $devicesCount . ' associated device(s) removed' : 'System deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error deleting system: ' . $e->getMessage()], 500);
        }
    }

    // NameDeviceController.php
    public function destroyNameDevice(Request $request, $id)
    {
        try {
            $nameDevice = NameDevice::findOrFail($id);
            $force = $request->input('force', false);
            
            // Check if name_device is in use
            $affectedDevices = Device::where('name_device_id', $id)->get();
            $devicesCount = $affectedDevices->count();
            
            if ($devicesCount > 0 && !$force) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Cannot delete device name because it is being used by ' . $devicesCount . ' device(s)',
                    'devices_count' => $devicesCount,
                    'can_force' => true
                ], 422);
            }
            
            // If forcing deletion, delete associated devices in cascade
            if ($force && $devicesCount > 0) {
                Device::where('name_device_id', $id)->delete();
            }
            
            $nameDevice->delete();
            return response()->json([
                'success' => true, 
                'message' => $force ? 'Device name forcefully deleted and ' . $devicesCount . ' associated device(s) removed' : 'Device name deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error deleting device name: ' . $e->getMessage()], 500);
        }
    }


    // Métodos de actualización
    public function updateBrand(Request $request, Brand $brand)
    {
        $request->validate(['name' => 'required|string|max:255']);

        try {
            $brand->update($request->all());
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 500);
        }
    }

    public function updateModel(Request $request, DeviceModel $model)
    {
        $request->validate(['name' => 'required|string|max:255']);

        try {
            $model->update($request->all());
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 500);
        }
    }

    public function updateSystem(Request $request, System $system)
    {
        $request->validate(['name' => 'required|string|max:255']);

        try {
            $system->update($request->all());
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 500);
        }
    }    public function updateNameDevice(Request $request, NameDevice $nameDevice)
    {
        $request->validate(['name' => 'required|string|max:255']);

        try {
            $nameDevice->update($request->all());
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 500);
        }
    }
    
    /**
     * Export devices that are in NinjaOne
     */
    public function exportNinjaOneDevices(Request $request)
    {
        $request->validate([
            'devices' => 'required|array',
            'devices.*' => 'exists:devices,id'
        ]);
        
        try {
            // Get devices that are in NinjaOne
            $devices = Device::whereIn('id', $request->devices)
                ->where('is_in_ninjaone', true)
                ->with(['brand', 'model', 'system', 'name_device'])
                ->get();
                
            if ($devices->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay dispositivos en NinjaOne para exportar'
                ], 404);
            }
            
            // Generate Excel file with PHPSpreadsheet
            return $this->generateDevicesExcel($devices, 'NinjaOne Devices');
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar dispositivos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export devices by building that are in NinjaOne
     */
    public function exportNinjaOneDevicesByBuilding(Request $request)
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'apartment_id' => 'required|exists:apartments,id'
        ]);
        
        try {
            // Get the building from the apartment
            $apartment = Apartment::findOrFail($request->apartment_id);
            $buildingId = $apartment->building_id;
            
            // Get all apartments in the building
            $apartmentIds = Apartment::where('building_id', $buildingId)->pluck('id');
            
            // Get tenants in these apartments
            $tenantIds = Tenant::whereIn('apartment_id', $apartmentIds)->pluck('id');
            
            // Get devices for these tenants that are in NinjaOne
            $devices = Device::whereHas('tenants', function ($query) use ($tenantIds) {
                $query->whereIn('tenants.id', $tenantIds);
            })
            ->where('is_in_ninjaone', true)
            ->with(['brand', 'model', 'system', 'name_device'])
            ->get();
            
            if ($devices->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay dispositivos en NinjaOne para este edificio'
                ], 404);
            }
            
            // Generate Excel file
            return $this->generateDevicesExcel($devices, 'NinjaOne Devices - Building ' . $apartment->building->name);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar dispositivos por edificio',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export devices by apartment that are in NinjaOne
     */
    public function exportNinjaOneDevicesByApartment(Request $request)
    {
        $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'apartment_id' => 'required|exists:apartments,id'
        ]);
        
        try {
            // Get tenants in this apartment
            $tenantIds = Tenant::where('apartment_id', $request->apartment_id)->pluck('id');
            
            // Get devices for these tenants that are in NinjaOne
            $devices = Device::whereHas('tenants', function ($query) use ($tenantIds) {
                $query->whereIn('tenants.id', $tenantIds);
            })
            ->where('is_in_ninjaone', true)
            ->with(['brand', 'model', 'system', 'name_device'])
            ->get();
            
            if ($devices->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay dispositivos en NinjaOne para este apartamento'
                ], 404);
            }
            
            // Get apartment
            $apartment = Apartment::findOrFail($request->apartment_id);
            
            // Generate Excel file
            return $this->generateDevicesExcel($devices, 'NinjaOne Devices - Apartment ' . $apartment->number);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar dispositivos por apartamento',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Helper method to generate Excel files for devices
     */
    private function generateDevicesExcel($devices, $title)
    {
        // Create new Spreadsheet object
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        
        // Set document properties
        $spreadsheet->getProperties()->setCreator('Ticketing System')
            ->setLastModifiedBy('Ticketing System')
            ->setTitle($title)
            ->setSubject('Device Export')
            ->setDescription('List of devices in NinjaOne');
            
        // Add some data
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setCellValue('A1', 'Name');
        $sheet->setCellValue('B1', 'Brand');
        $sheet->setCellValue('C1', 'Model');
        $sheet->setCellValue('D1', 'System');
        $sheet->setCellValue('E1', 'Location');
        
        // Add data from devices
        $row = 2;
        foreach ($devices as $device) {
            $sheet->setCellValue('A' . $row, $device->name_device ? $device->name_device->name : '');
            $sheet->setCellValue('B' . $row, $device->brand ? $device->brand->name : '');
            $sheet->setCellValue('C' . $row, $device->model ? $device->model->name : '');
            $sheet->setCellValue('D' . $row, $device->system ? $device->system->name : '');
            $sheet->setCellValue('E' . $row, $device->ubicacion ?? '');
            $row++;
        }
        
        // Create Excel file
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        
        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'devices');
        $writer->save($tempFile);
        
        // Return as download
        return response()->download($tempFile, $title . '.xlsx')
            ->deleteFileAfterSend(true);
    }
}
