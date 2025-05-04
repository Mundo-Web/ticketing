<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Apartment;
use App\Models\Brand;
use App\Models\Building;
use App\Models\Device;
use App\Models\DeviceModel;
use App\Models\System;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    /*  public function destroy(Customer $customer, Apartment $apartment)
    {
        $apartment->delete();
        return redirect()->back()->with('success', 'Departamento eliminado');
    }


   public function storeApartment(Request $request, Customer $building)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            // Validación adicional si necesitas
        ]);

        $apartment = $building->apartments()->create($validated);

        return redirect()->back()->with('success', 'Departamento creado correctamente.');
    }

    public function updateApartment(Apartment $apartment, Request $request)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'ubicacion' => 'string|max:255',

        ]);

        $apartment->update($validated);

        return redirect()->back()->with('success', 'Departamento creado correctamente.');
    }*/
    public function storeApartment(Request $request, Building $building)
    {

        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'ubicacion' => 'nullable|string|max:255',
                'tenant.name' => 'nullable|string|max:255',
                'tenant.email' => 'nullable|email|max:255',
                'tenant.phone' => 'nullable|string|max:20',
                'tenant.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            $apartment = $building->apartments()->create([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion,
                'status' => true
            ]);

            if (!empty($request->tenant['name'])) {
                $this->saveTenant($request, $apartment);
            }

            return redirect()->back()->with('success', 'Apartment created successfully');
        } catch (\Exception $e) {
            \Log::error('Error creating apartment: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error creating apartment']);
        }
    }

    public function updateApartment(Apartment $apartment, Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'ubicacion' => 'nullable|string|max:255',
                'tenant.name' => 'nullable|string|max:255',
                'tenant.email' => 'nullable|email|max:255',
                'tenant.phone' => 'nullable|string|max:20',
                'tenant.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);

            $apartment->update([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion
            ]);

            $this->saveTenant($request, $apartment);

            return redirect()->back()->with('success', 'Apartment updated successfully');
        } catch (\Exception $e) {
            \Log::error('Error updating apartment: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error updating apartment']);
        }
    }

    private function saveTenant(Request $request, Apartment $apartment)
    {
        $tenantData = [
            'name' => $request->input('tenant.name'),
            'email' => $request->input('tenant.email'),
            'phone' => $request->input('tenant.phone'),
        ];

        if ($request->hasFile('tenant.photo')) {
            $path = $request->file('tenant.photo')->store('tenants', 'public');
            $tenantData['photo'] = $path;

            // Delete old photo if exists
            if ($apartment->tenant && $apartment->tenant->photo) {
                Storage::disk('public')->delete($apartment->tenant->photo);
            }
        }

        if ($apartment->tenant) {
            $apartment->tenant()->update($tenantData);
        } else {
            $apartment->tenant()->create($tenantData);
        }
    }

    public function destroy(Customer $customer, Apartment $apartment)
    {
        try {
            if ($apartment->tenant) {
                if ($apartment->tenant->photo) {
                    Storage::disk('public')->delete($apartment->tenant->photo);
                }
                $apartment->tenant()->delete();
            }

            $apartment->delete();

            return redirect()->back()->with('success', 'Apartment deleted successfully');
        } catch (\Exception $e) {
            \Log::error('Error deleting apartment: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error deleting apartment']);
        }
    }

    public function updateStatus(Request $request, Apartment $apartment)
    {
        \Log::info('Payload recibido:', $request->all());
        \Log::info('Estado antes:', ['status' => $apartment->status]);

        $validated = $request->validate([
            'status' => 'required|boolean'
        ]);

        $apartment->update($validated);

        \Log::info('Estado después:', ['status' => $apartment->fresh()->status]);

        return back()->with('success', 'Estado actualizado');
    }
}
