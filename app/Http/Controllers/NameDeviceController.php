<?php

namespace App\Http\Controllers;

use App\Models\NameDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NameDeviceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        // Check if current user is default technical
        if ($user->hasRole('technical')) {
            $technical = \App\Models\Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        // Only super-admin and default technical can access name devices management
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        $nameDevices = NameDevice::query()
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('NameDevices/Index', [
            'nameDevices' => $nameDevices,
            'filters' => [
                'search' => $request->input('search')
            ]
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = \App\Models\Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        return Inertia::render('NameDevices/Create');
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = \App\Models\Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:name_devices,name',
            'status' => 'nullable|string|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048'
        ]);

        $nameDevice = new NameDevice($validated);

        // Handle image upload
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $imagePath = $image->storeAs('name-devices', $imageName, 'public');
            $nameDevice->image = $imagePath;
        }

        $nameDevice->save();

        return redirect()->route('name-devices.index')
            ->with('success', 'Device name created successfully.');
    }

    public function show(NameDevice $nameDevice)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = \App\Models\Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        return Inertia::render('NameDevices/Show', [
            'nameDevice' => $nameDevice
        ]);
    }

    public function edit(NameDevice $nameDevice)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = \App\Models\Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        return Inertia::render('NameDevices/Edit', [
            'nameDevice' => $nameDevice
        ]);
    }

    public function update(Request $request, NameDevice $nameDevice)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = \App\Models\Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:name_devices,name,' . $nameDevice->id,
            'status' => 'nullable|string|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048'
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($nameDevice->image && Storage::disk('public')->exists($nameDevice->image)) {
                Storage::disk('public')->delete($nameDevice->image);
            }

            $image = $request->file('image');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $imagePath = $image->storeAs('name-devices', $imageName, 'public');
            $validated['image'] = $imagePath;
        }

        $nameDevice->update($validated);

        return redirect()->route('name-devices.index')
            ->with('success', 'Device name updated successfully.');
    }

    public function destroy(NameDevice $nameDevice)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');
        $isDefaultTechnical = false;
        
        if ($user->hasRole('technical')) {
            $technical = \App\Models\Technical::where('email', $user->email)->first();
            $isDefaultTechnical = $technical && $technical->is_default;
        }
        
        if (!$isSuperAdmin && !$isDefaultTechnical) {
            abort(403, 'Access denied');
        }

        // Delete image if exists
        if ($nameDevice->image && Storage::disk('public')->exists($nameDevice->image)) {
            Storage::disk('public')->delete($nameDevice->image);
        }

        $nameDevice->delete();

        return redirect()->route('name-devices.index')
            ->with('success', 'Device name deleted successfully.');
    }
}