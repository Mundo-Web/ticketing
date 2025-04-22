<?php

namespace App\Http\Controllers;

use App\Models\Apartment;
use App\Models\Device;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function store(Apartment $apartment, Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'brand_id' => 'required|exists:brands,id',
            'system_id' => 'required|exists:systems,id'
        ]);

        $device = $apartment->devices()->create($validated);

        return redirect()->back()->with('success', 'Dispositivo agregado');
    }

    public function update(Apartment $apartment, Device $device, Request $request)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'brand_id' => 'sometimes|exists:brands,id',
            'system_id' => 'sometimes|exists:systems,id'
        ]);

        $device->update($validated);

        return redirect()->back()->with('success', 'Dispositivo actualizado');
    }

    public function destroy(Apartment $apartment, Device $device)
    {
        $device->delete();
        return redirect()->back()->with('success', 'Dispositivo eliminado');
    }
}
