<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Apartment;
use App\Models\Brand;
use App\Models\Device;
use App\Models\DeviceModel;
use App\Models\System;

use Illuminate\Http\Request;


class ApartmentController extends Controller
{

    public function store(Request $request)
    {
        try {
            \Log::info('Request Data:', $request->all());
            $request->validate([
                'name' => 'required|string|max:255',
                'ubicacion' => 'nullable|string|max:255',
                //  'devices' => 'array',
                // 'devices.*.name' => 'required|string|max:255',
                //  'devices.*.brand' => 'required|string|max:255',
                //  'devices.*.model' => 'required|string|max:255',
                //  'devices.*.system' => 'required|string|max:255',
            ]);

            // ✅ Crear el departamento
            $apartment = Apartment::create([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion,
                'customers_id' => $request->customer_id ?? 1, // Cambia según cómo pases el cliente
            ]);

            // ✅ Procesar cada dispositivo
            /*  foreach ($request->devices as $deviceData) {
                $brand = Brand::firstOrCreate(['name' => $deviceData['brand']], ['status' => true]);
                $model = DeviceModel::firstOrCreate(['name' => $deviceData['model']], ['status' => true]);
                $system = System::firstOrCreate(['name' => $deviceData['system']], ['status' => true]);

                $device = Device::create([
                    'name' => $deviceData['name'],
                    'brand_id' => $brand->id,
                    'model_id' => $model->id,
                    'system_id' => $system->id,
                    'status' => true,
                ]);

                $apartment->devices()->attach($device->id);
            }*/

            return response()->json([
                'success' => true,
                //'apartment' => $apartment->load('devices.brand', 'devices.model', 'devices.system'),
                'apartment' => $apartment,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al guardar apartamento: ' . $e->getMessage());
            return response()->json(['error' => 'Hubo un problema al guardar el departamento.'], 500);
        }
    }


    public function update(Customer $customer, Apartment $apartment, Request $request)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'ubicacion' => 'sometimes|string|max:255',
            'status' => 'sometimes|boolean'
        ]);

        $apartment->update($validated);

        return redirect()->back()->with('success', 'Departamento actualizado');
    }

    public function destroy(Customer $customer, Apartment $apartment)
    {
        $apartment->delete();
        return redirect()->back()->with('success', 'Departamento eliminado');
    }
}
