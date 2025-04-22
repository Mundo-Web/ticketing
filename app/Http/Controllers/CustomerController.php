<?php

namespace App\Http\Controllers;

use App\Models\Customer;
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
        return Inertia::render('Customers/index', ['customers' => $customers]);
    }

    public function store(Request $request)
    {
        $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'required|in:active,inactive',
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            // Procesar imagen según tu método preferido
            $full = $request->file('image');
            $uuid = Crypto::randomUUID();
            $ext = $full->getClientOriginalExtension();
            $path = "images/{$snake_case}/{$uuid}.{$ext}";

            // Crear directorio si no existe
            if (!Storage::exists("images/{$snake_case}")) {
                Storage::makeDirectory("images/{$snake_case}");
            }

            Storage::disk('public')->put($path, file_get_contents($full));
            $validated['image'] = $path; // Guardamos la ruta completa

            Customer::create($validated);

            return redirect()->route('customers.index')
                ->with('success', 'Cliente creado correctamente');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Error al crear cliente: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', ['customer' => $customer]);
    }

    public function update(Request $request, Customer $customer)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'required|in:active,inactive',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            if ($request->hasFile('image')) {
                // Eliminar imagen anterior si existe
                if ($customer->image && Storage::exists($customer->image)) {
                    Storage::delete($customer->image);
                }

                // Procesar nueva imagen
                $full = $request->file('image');
                $uuid = Crypto::randomUUID();
                $ext = $full->getClientOriginalExtension();
                $path = "images/customer/{$uuid}.{$ext}";
                Storage::put($path, file_get_contents($full));
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
            // Eliminar imagen asociada
            if ($customer->image && Storage::exists($customer->image)) {
                Storage::delete($customer->image);
            }

            $customer->delete();

            return redirect()->route('customers.index')
                ->with('success', 'Cliente eliminado correctamente');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Error al eliminar cliente: ' . $e->getMessage());
        }
    }
}
