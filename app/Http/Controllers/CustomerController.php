<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Customer;
use App\Models\DeviceModel;
use App\Models\System;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use SoDe\Extend\Crypto;
use SoDe\Extend\Text;

class CustomerController extends Controller
{
    public $model = Customer::class;

    public function index()
    {
        $customers = Customer::latest()->paginate(6);

        $data = $customers->toArray();

        return Inertia::render('Customers/index', [
            'customers' => [
                'data' => $data['data'],
                'links' => $data['links'],
                'meta' => [
                    'current_page' => $data['current_page'],
                    'from' => $data['from'],
                    'last_page' => $data['last_page'],
                    'path' => $data['path'],
                    'per_page' => $data['per_page'],
                    'to' => $data['to'],
                    'total' => $data['total'],
                ],
            ]
        ]);
    }

    public function updateStatus(Request $request, Customer $customer)
    {
        \Log::info('Payload recibido:', $request->all());
        \Log::info('Estado antes:', ['status' => $customer->status]);

        $validated = $request->validate([
            'status' => 'required|boolean'
        ]);

        $customer->update($validated);

        \Log::info('Estado después:', ['status' => $customer->fresh()->status]);

        return back()->with('success', 'Estado actualizado');
    }



    public function store(Request $request)
    {
        $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            $full = $request->file('image');
            $uuid = Crypto::randomUUID();
            $ext = $full->getClientOriginalExtension();
            $path = "images/{$snake_case}/{$uuid}.{$ext}";

            if (!Storage::disk('public')->exists("images/{$snake_case}")) {
                Storage::disk('public')->makeDirectory("images/{$snake_case}");
            }

            Storage::disk('public')->put($path, file_get_contents($full));

            Customer::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'image' => $path,
                'status' => true // Por defecto activo
            ]);

            return redirect()->route('customers.index')
                ->with('success', 'Cliente creado correctamente');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Error al crear cliente: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, Customer $customer)
    {

        $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', get_class($customer)));

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            // Si se proporciona una nueva imagen, la reemplazamos
            if ($request->hasFile('image')) {
                if ($customer->image && Storage::disk('public')->exists($customer->image)) {
                    Storage::disk('public')->delete($customer->image);
                }

                $full = $request->file('image');
                $uuid = Crypto::randomUUID();
                $ext = $full->getClientOriginalExtension();
                $path = "images/{$snake_case}/{$uuid}.{$ext}";

                Storage::disk('public')->put($path, file_get_contents($full));
                $validated['image'] = $path;
            }

            $customer->update($validated);

            return redirect()->route('customers.index')
                ->with('success', 'Cliente actualizado correctamente');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Error al actualizar cliente: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy(Customer $customer)
    {
        try {
            if ($customer->image && Storage::disk('public')->exists($customer->image)) {
                Storage::disk('public')->delete($customer->image);
            }

            $customer->delete();

            return redirect()->route('customers.index')
                ->with('success', 'Cliente eliminado correctamente');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Error al eliminar cliente: ' . $e->getMessage());
        }
    }

    // app/Http/Controllers/ClientController.php
    public function apartments(Customer $customer)
    {
        return Inertia::render('Tenants/index', [
            'customer' => $customer->load(['apartments.devices.brand', 'apartments.devices.system', 'apartments.devices.model']),
            'brands' => Brand::all(),
            'systems' => System::all(),
            'models' => DeviceModel::all()
        ]);
    }
}
