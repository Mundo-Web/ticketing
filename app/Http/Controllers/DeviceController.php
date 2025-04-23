<?php

namespace App\Http\Controllers;

use App\Models\Apartment;
use App\Models\Brand;
use App\Models\Device;
use App\Models\DeviceModel;
use App\Models\NameDevice;
use App\Models\System;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function store(Request $request)
    {
        //dd($request->all());
        $request->validate([

            'apartment_id' => 'required|exists:apartments,id',
        ]);
        if ($request->filled('new_name_device')) {
            $name_device = NameDevice::firstOrCreate(['name' => $request->new_name_device]);

            $name_device_id = $name_device->id;
        } else {
            // Si no se pasó el nuevo nombre de dispositivo, intenta con el ID proporcionado
            $name_device_id = $request->name_device_id;
            if (!$name_device_id) {
                return redirect()->back()->with('error', 'El ID del nombre de dispositivo es obligatorio.');
            }
        }

        // Marca
        if ($request->filled('new_brand')) {
            $brand = Brand::firstOrCreate(['name' => $request->new_brand]);
            $brand_id = $brand->id;
        } else {
            $brand_id = $request->brand_id;
        }

        // Modelo
        if ($request->filled('new_model')) {
            $model = DeviceModel::firstOrCreate(['name' => $request->new_model]);
            $model_id = $model->id;
        } else {
            $model_id = $request->model_id;
        }

        // Sistema
        if ($request->filled('new_system')) {
            $system = System::firstOrCreate(['name' => $request->new_system]);
            $system_id = $system->id;
        } else {
            $system_id = $request->system_id;
        }

        // Crear dispositivo
        $device = Device::create([
            'name' => $request->name,
            'brand_id' => $brand_id,
            'model_id' => $model_id,
            'system_id' => $system_id,
            'name_device_id' => $name_device_id,
            'apartment_id' => $request->apartment_id, // Esto es solo para la relación directa
        ]);

        // Asociar el dispositivo al apartamento en la tabla pivot
        $device->apartments()->attach($request->apartment_id);

        return response()->json([
            'device' => Device::with(['brand', 'model', 'system', 'name_device'])->find($device->id)
        ]);
    }


    public function update(Request $request, Device $device)
    {
        if ($request->filled('new_name_device')) {
            $name_device = NameDevice::firstOrCreate(['name' => $request->new_name_device]);
            $name_device_id = $name_device->id;
        } else {
            $name_device_id = $request->name_device_id;
        }

        // Marca
        if ($request->filled('new_brand')) {
            $brand = Brand::firstOrCreate(['name' => $request->new_brand]);
            $brand_id = $brand->id;
        } else {
            $brand_id = $request->brand_id;
        }

        // Modelo
        if ($request->filled('new_model')) {
            $model = DeviceModel::firstOrCreate(['name' => $request->new_model]);
            $model_id = $model->id;
        } else {
            $model_id = $request->model_id;
        }

        // Sistema
        if ($request->filled('new_system')) {
            $system = System::firstOrCreate(['name' => $request->new_system]);
            $system_id = $system->id;
        } else {
            $system_id = $request->system_id;
        }

        $device->update([

            'brand_id' => $brand_id,
            'model_id' => $model_id,
            'system_id' => $system_id,
            'name_device_id' => $name_device_id,
        ]);

        return response()->json([
            'device' => Device::with(['brand', 'model', 'system', 'name_device'])->find($device->id)
        ]);
    }


    public function destroy(Device $device)
    {
        $device->delete();
        return response()->json(['message' => 'Dispositivo eliminado correctamente.']);
    }
}
