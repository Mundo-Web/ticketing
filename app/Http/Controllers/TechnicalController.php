<?php

namespace App\Http\Controllers;

use App\Models\Technical;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TechnicalController extends Controller
{
    public function index(Request $request)
    {
        $technicals = Technical::query()
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Technicals/index', [
            'technicals' => $technicals,
            'filters' => $request->only(['search'])
        ]);
    }
    private function storeImage($file, $folder): string
    {
        $path = $file->store("images/{$folder}", 'public');
        return $path;
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:technicals,email',
            'phone' => 'required|string|max:20',
            'shift' => 'required|in:morning,afternoon,night',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('images/technicals', 'public');
        }

        // Verifica si es el primero en la tabla
        $validated['is_default'] = Technical::count() === 0 ? true : false;

        $technical = Technical::create($validated);

        $user = User::updateOrCreate(
            ['email' => $technical->email],
            [
                'name' => $technical->name,
                'password' => Hash::make($technical->email),
            ]
        );

        if (!$user->hasRole('technical')) {
            $user->assignRole('technical');
        }

        return redirect()->route('technicals.index')->with('success', 'Technical created successfully');
    }

    public function update(Request $request, Technical $technical)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:technicals,email,' . $technical->id,
            'phone' => 'required|string|max:20',
            'shift' => 'required|in:morning,afternoon,night',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            if ($technical->photo) {
                Storage::disk('public')->delete($technical->photo);
            }
            $validated['photo'] = $request->file('photo')->store('images/technicals', 'public');
        }

        $technical->update($validated);

        return redirect()->route('technicals.index')->with('success', 'Technical updated successfully');
    }

    public function destroy(Technical $technical)
    {
        if ($technical->photo) {
            Storage::disk('public')->delete($technical->photo);
        }

        $technical->delete();
        return redirect()->route('technicals.index')->with('success', 'Technical deleted successfully');
    }

    public function updateStatus(Request $request, Technical $technical)
    {
        $technical->update(['status' => !$technical->status]);
        return back()->with('success', 'Status updated');
    }
}
