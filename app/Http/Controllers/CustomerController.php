<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        //$customers = Customer::paginate(10);
        $customers = Customer::all();
        
        return view('customers', compact('customers'));
        //return Inertia::render('Customers/index', 
        //['customers' => $customer]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia::render("customers/create");
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'require|email|unique:customers,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255'
            ]);
            Customer::create($validated);
            return redirect('customers.index')
            ->with('success', 'creado satifactoriamente');
        } catch (\Exception $e) {
            return redirect()
            ->back()
            ->with('error', 'algo slaio mal:' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Customer $customer)
    {
        return Inertia::render('customers.edit', [
            'customer' => $customer
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'require|email|unique:customers,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255'
            ]);
            $customer->update($validated);
            return redirect('customers.index')
            ->with('success', 'creado satifactoriamente');
        } catch (\Exception $e) {
            return redirect()
            ->back()
            ->with('error', 'algo slaio mal:' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
