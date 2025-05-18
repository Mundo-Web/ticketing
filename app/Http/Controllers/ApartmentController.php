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







    public function storeApartment(Request $request, Building $building)
    {

        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'ubicacion' => 'nullable|string|max:255',
            
                'tenants' => 'array',

                'tenants.*.name' => 'nullable|string|max:255',
                'tenants.*.email' => 'nullable|email|max:255',
                'tenants.*.phone' => 'nullable|string|max:20',
                'tenants.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            ]);



            $apartment = $building->apartments()->create([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion,
           
                'status' => true
            ]);


            $this->saveTenant($request, $apartment);

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
                'ubicacion' => $request->ubicacion,
               
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
        if (!$request->has('tenants')) {
            return;
        }
    
        // First delete removed tenants
        $currentTenantIds = $apartment->tenants()->pluck('id')->toArray();
        $newTenantIds = collect($request->tenants)->pluck('id')->filter()->toArray();
        $idsToDelete = array_diff($currentTenantIds, $newTenantIds);
    
        if (!empty($idsToDelete)) {
            $tenantsToDelete = $apartment->tenants()->whereIn('id', $idsToDelete)->get();
            foreach ($tenantsToDelete as $tenant) {
                if ($tenant->photo) {
                    Storage::disk('public')->delete($tenant->photo);
                }
            }
            $apartment->tenants()->whereIn('id', $idsToDelete)->delete();
        }
    
        // Update or create tenants
        foreach ($request->tenants as $tenantData) {
            $data = [
                'name' => $tenantData['name'],
                'email' => $tenantData['email'],
                'phone' => $tenantData['phone'],
            ];
    
            if (isset($tenantData['photo']) && $tenantData['photo'] instanceof \Illuminate\Http\UploadedFile) {
                $path = $tenantData['photo']->store('tenants', 'public');
                $data['photo'] = $path;
    
                // Delete old photo if exists
                if (isset($tenantData['id'])) {
                    $existingTenant = $apartment->tenants()->find($tenantData['id']);
                    if ($existingTenant && $existingTenant->photo) {
                        Storage::disk('public')->delete($existingTenant->photo);
                    }
                }
            }
    
            if (isset($tenantData['id'])) {
                $apartment->tenants()->where('id', $tenantData['id'])->update($data);
            } else {
                $apartment->tenants()->create($data);
            }
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
