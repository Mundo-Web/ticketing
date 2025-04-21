<?php

namespace App\Http\Controllers;

use App\Models\Support;
use Illuminate\Auth\Events\Validated;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $supports = Support::paginate(10);
        return Inertia::render('Supports/index', [
            'suports' => $supports
        ]);

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return Inertia::render('supports/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
        try {
            $validate = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'require|email|unique:customers,email',
                'phone' => 'nullable|string|max:20',
                'speciality' => 'nullable|string|in:Software, Hardware, Networking',
            ]);
            Support::create($validate);
            return redirect()
                ->route('supports.index')
                ->with('success', 'Registro creado');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'No se creo el registro' . $e->getMessage());
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
    public function edit(Support $support)
    {
        return Inertia::render('supports.edit', [
            'support' => $support
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Support $support)
    {
        try {
            $validate = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'require|email|unique:customers,email',
                'phone' => 'nullable|string|max:20',
                'speciality' => 'nullable|string|in:Software, Hardware, Networking',
            ]);
            $support->update($validate);
            return redirect()
                ->route('supports.index')
                ->with('success', 'Registro creado');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'No se creo el registro' . $e->getMessage());
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
