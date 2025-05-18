<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Apartment;
use App\Models\Building;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ApartmentController extends Controller
{
    public function storeApartment(Request $request, Building $building)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'tenants' => 'required|array',
            'tenants.*.name' => 'required|string|max:255',
            'tenants.*.email' => 'required|email|max:255',
            'tenants.*.phone' => 'required|string|max:20',
            'tenants.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        DB::beginTransaction();

        try {
            $apartment = $building->apartments()->create([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion,
                'status' => true
            ]);

            $this->saveTenants($request, $apartment);

            DB::commit();

            return redirect()->back()->with('success', 'Apartamento creado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Error al crear el apartamento: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function updateApartment(Request $request, Apartment $apartment)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'tenants' => 'required|array',
            'tenants.*.name' => 'required|string|max:255',
            'tenants.*.email' => 'required|email|max:255',
            'tenants.*.phone' => 'required|string|max:20',
            'tenants.*.photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'tenants.*.id' => 'nullable|exists:tenants,id',
        ]);

        DB::beginTransaction();

        try {
            $apartment->update([
                'name' => $request->name,
                'ubicacion' => $request->ubicacion,
            ]);

            $this->saveTenants($request, $apartment);

            DB::commit();

            return redirect()->back()->with('success', 'Apartamento actualizado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Error al actualizar el apartamento: ' . $e->getMessage()])
                ->withInput();
        }
    }

    private function saveTenants(Request $request, Apartment $apartment)
    {
        $currentTenantIds = $apartment->tenants()->pluck('id')->toArray();
        $newTenantIds = [];
        $photosToDelete = [];

        foreach ($request->tenants as $tenantData) {
            $data = [
                'name' => $tenantData['name'],
                'email' => $tenantData['email'],
                'phone' => $tenantData['phone'],
                'apartment_id' => $apartment->id
            ];

            // Manejar la foto
            if (isset($tenantData['photo'])) {
                $path = $tenantData['photo']->store('tenants', 'public');
                $data['photo'] = $path;

                // Si es una actualización, marcar la foto anterior para eliminación
                if (isset($tenantData['id']) && in_array($tenantData['id'], $currentTenantIds)) {
                    $existingTenant = $apartment->tenants()->find($tenantData['id']);
                    if ($existingTenant && $existingTenant->photo) {
                        $photosToDelete[] = $existingTenant->photo;
                    }
                }
            }

            if (isset($tenantData['id']) && in_array($tenantData['id'], $currentTenantIds)) {
                // Actualizar inquilino existente
                $apartment->tenants()->where('id', $tenantData['id'])->update($data);
                $newTenantIds[] = $tenantData['id'];
            } else {
                // Crear nuevo inquilino
                $tenant = $apartment->tenants()->create($data);
                $newTenantIds[] = $tenant->id;
            }
        }

        // Eliminar inquilinos que ya no están en la lista
        $idsToDelete = array_diff($currentTenantIds, $newTenantIds);
        if (!empty($idsToDelete)) {
            $tenantsToDelete = $apartment->tenants()->whereIn('id', $idsToDelete)->get();
            foreach ($tenantsToDelete as $tenant) {
                if ($tenant->photo) {
                    $photosToDelete[] = $tenant->photo;
                }
            }
            $apartment->tenants()->whereIn('id', $idsToDelete)->delete();
        }

        // Eliminar fotos marcadas
        foreach (array_unique($photosToDelete) as $photo) {
            Storage::disk('public')->delete($photo);
        }
    }

    public function destroy(Apartment $apartment)
    {
        DB::beginTransaction();

        try {
            // Eliminar fotos de inquilinos
            $photosToDelete = $apartment->tenants()->pluck('photo')->filter()->toArray();
            
            // Eliminar inquilinos
            $apartment->tenants()->delete();
            
            // Eliminar apartamento
            $apartment->delete();

            // Eliminar fotos
            foreach ($photosToDelete as $photo) {
                Storage::disk('public')->delete($photo);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Apartamento eliminado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->withErrors(['error' => 'Error al eliminar el apartamento: ' . $e->getMessage()]);
        }
    }

    public function updateStatus(Request $request, Apartment $apartment)
    {
        $request->validate([
            'status' => 'required|boolean'
        ]);

        $apartment->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Estado actualizado',
            'status' => $apartment->status
        ]);
    }
}