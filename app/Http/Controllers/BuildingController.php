<?php

namespace App\Http\Controllers;

use App\Models\Apartment;
use App\Models\Brand;
use App\Models\Building;
use App\Models\DeviceModel;
use App\Models\Owner;
use App\Models\Doorman;
use App\Models\NameDevice;
use App\Models\System;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use SoDe\Extend\Crypto;
use SoDe\Extend\Text;

class BuildingController extends Controller
{
    public function index(Request $request)
    {
        $statusFilter = $request->input('status', 'active');

        $buildings = Building::with(['owner', 'doormen', 'apartments'])
            ->when($statusFilter === 'active', function ($query) {
                return $query->where('status', true);
            })
            ->when($statusFilter === 'inactive', function ($query) {
                return $query->where('status', false);
            })
            ->latest()
            ->paginate(6);
        $data = $buildings->toArray();
        return Inertia::render('Buildings/Index', [
            'googleMapsApiKey' => env('GMAPS_API_KEY'),
            'buildings' => [
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
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location_link' => 'nullable|string',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'owner.name' => 'required|string|max:255',
            'owner.email' => 'required|email',
            'owner.phone' => 'nullable|string',
            'owner.photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'doormen' => 'array',
            'doormen.*.name' => 'required|string|max:255',
            'doormen.*.email' => 'required|email',
            'doormen.*.phone' => 'nullable|string',
            'doormen.*.photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Create Building
        $building = $this->saveBuilding($request);

        // Create Owner
        $this->saveOwner($request, $building);

        // Create Doormen
        $this->saveDoormen($request, $building);

        return redirect()->route('buildings.index')
            ->with('success', 'Building created successfully');
    }

    public function update(Request $request, Building $building)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location_link' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'owner.name' => 'required|string|max:255',
            'owner.email' => 'required|email',
            'owner.phone' => 'nullable|string',
            'owner.photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'doormen' => 'array',
            'doormen.*.name' => 'required|string|max:255',
            'doormen.*.email' => 'required|email',
            'doormen.*.phone' => 'nullable|string',
            'doormen.*.photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'doormen.*.shift' => 'required|in:morning,afternoon,night',
        ]);

        // Update Building
        $this->saveBuilding($request, $building);

        // Update Owner
        $this->saveOwner($request, $building);

        // Update Doormen
        $this->saveDoormen($request, $building);

        return redirect()->route('buildings.index')
            ->with('success', 'Building updated successfully');
    }

    private function saveBuilding(Request $request, Building $building = null): Building
    {
        $data = [
            'name' => $request->name,
            'description' => $request->description,
            'location_link' => $request->location_link,
            'status' => true
        ];

        if ($request->hasFile('image')) {
            $path = $this->storeImage($request->file('image'), 'buildings');
            $data['image'] = $path;

            // Delete old image if updating
            if ($building && $building->image) {
                Storage::disk('public')->delete($building->image);
            }
        }

        if ($building) {
            $building->update($data);
            return $building;
        }

        return Building::create($data);
    }

    private function saveOwner(Request $request, Building $building)
    {
        $ownerData = [
            'name' => $request->owner['name'],
            'email' => $request->owner['email'],
            'phone' => $request->owner['phone'],
        ];

        if ($request->hasFile('owner.photo')) {
            $path = $this->storeImage($request->file('owner.photo'), 'owners');
            $ownerData['photo'] = $path;

            // Delete old photo if exists
            if ($building->owner && $building->owner->photo) {
                Storage::disk('public')->delete($building->owner->photo);
            }
        }

        if ($building->owner) {
            $building->owner()->update($ownerData);
            $owner = $building->owner;
        } else {
            $owner = $building->owner()->create($ownerData);
        }

        // Crear o actualizar el usuario asociado al owner
        // Suponemos que la relación se hace por email (puedes ajustarlo si usas user_id)

        $user = User::updateOrCreate(
            ['email' => $owner->email], // condición para buscar
            [
                'name' => $owner->name,
                'password' => Hash::make($owner->email), // contraseña igual al email, cambia si quieres
            ]
        );

        // Asignar rol de owner (evita duplicados)
        if (!$user->hasRole('owner')) {
            $user->assignRole('owner');
        }

        // Opcional: si quieres enlazar el owner con el user en la DB con user_id
        // $owner->user_id = $user->id;
        // $owner->save();

        return $owner;
    }
    private function saveDoormen(Request $request, Building $building)
    {
        // Eliminar doormen que se removieron
        $currentDoormanIds = $building->doormen->pluck('id')->toArray();
        $newDoormanIds = collect($request->doormen)->pluck('id')->filter()->toArray();
        $idsToDelete = array_diff($currentDoormanIds, $newDoormanIds);

        if (!empty($idsToDelete)) {
            $doormenToDelete = $building->doormen()->whereIn('id', $idsToDelete)->get();
            foreach ($doormenToDelete as $doorman) {
                if ($doorman->photo) {
                    Storage::disk('public')->delete($doorman->photo);
                }
                // Opcional: también borrar el usuario asociado si quieres
                $user = User::where('email', $doorman->email)->first();
                if ($user) {
                    $user->delete();
                }
            }
            $building->doormen()->whereIn('id', $idsToDelete)->delete();
        }

        // Crear o actualizar doormen y usuarios asociados
        foreach ($request->doormen as $doormanData) {
            $data = [
                'name' => $doormanData['name'],
                'email' => $doormanData['email'],
                'phone' => $doormanData['phone'],
                'shift' => $doormanData['shift']
            ];

            if (isset($doormanData['photo']) && $doormanData['photo'] instanceof \Illuminate\Http\UploadedFile) {
                $path = $this->storeImage($doormanData['photo'], 'doormen');
                $data['photo'] = $path;

                // Borrar foto vieja si existe
                if (isset($doormanData['id'])) {
                    $existingDoorman = Doorman::find($doormanData['id']);
                    if ($existingDoorman && $existingDoorman->photo) {
                        Storage::disk('public')->delete($existingDoorman->photo);
                    }
                }
            }

            if (isset($doormanData['id'])) {
                // Actualizar doorman
                $building->doormen()->where('id', $doormanData['id'])->update($data);
                $doorman = Doorman::find($doormanData['id']);
            } else {
                // Crear nuevo doorman
                $doorman = $building->doormen()->create($data);
            }

            // Crear o actualizar usuario asociado al doorman
            $user = User::updateOrCreate(
                ['email' => $doorman->email],
                [
                    'name' => $doorman->name,
                    'password' => Hash::make($doorman->email), // contraseña igual al email (puedes cambiar)
                ]
            );

            if (!$user->hasRole('doorman')) {
                $user->assignRole('doorman');
            }
        }
    }

    private function storeImage($file, $folder): string
    {
        $path = $file->store("images/{$folder}", 'public');
        return $path;
    }

    private function detectLocationFormat($locationLink)
    {
        if (empty($locationLink)) {
            return 'empty';
        }
        
        // Coordenadas directas formato "lat, lng"
        if (preg_match('/^([-0-9.]+),\s*([-0-9.]+)$/', trim($locationLink))) {
            return 'direct_coordinates';
        }
        
        // Links acortados de Google
        if (strpos($locationLink, 'maps.app.goo.gl') !== false) {
            return 'google_short_link';
        }
        
        // URLs completas de Google Maps
        if (strpos($locationLink, 'google.com/maps') !== false) {
            return 'google_maps_url';
        }
        
        // Embed URLs
        if (strpos($locationLink, '/embed') !== false) {
            return 'embed_url';
        }
        
        return 'unknown';
    }

    public function destroy(Building $building)
    {
        // Delete images
        if ($building->image) {
            Storage::disk('public')->delete($building->image);
        }

        if ($building->owner && $building->owner->photo) {
            Storage::disk('public')->delete($building->owner->photo);
        }

        foreach ($building->doormen as $doorman) {
            if ($doorman->photo) {
                Storage::disk('public')->delete($doorman->photo);
            }
        }

        $building->delete();

        return redirect()->route('buildings.index')
            ->with('success', 'Building deleted successfully');
    }

    public function apartments(Building $building)
    {
        // Asegurar que el building tenga todos los datos necesarios
        $building = Building::with(['owner', 'doormen'])->find($building->id);
        
        // Debug temporal - quitar después
        \Log::info('Building data:', [
            'id' => $building->id,
            'name' => $building->name,
            'location_link' => $building->location_link,
            'location_link_format_detected' => $this->detectLocationFormat($building->location_link)
        ]);
        
        $apartments = Apartment::with([
            'tenants.devices' => function ($query) {
                $query->with(['tenants', 'brand', 'system', 'model', 'name_device', 'sharedWith']);
            },

            'tenants.sharedDevices' => function ($q) { // Dispositivos compartidos
                $q->with(['brand', 'system', 'model', 'name_device', 'owner']);
            }

        ])->where('buildings_id', $building->id)
            ->latest()
            ->paginate(6);

        $data = $apartments->toArray();
        
        return Inertia::render('Tenants/index', [
            'googleMapsApiKey' => env('GMAPS_API_KEY'),
            'building' => $building,
            'all_buildings' => Building::select('id', 'name', 'image')->get(),
            'apartments' => [
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
            ],
            'brands' => Brand::all(),
            'systems' => System::all(),
            'models' => DeviceModel::all(),
            'name_devices' => NameDevice::all()
        ]);
    }

    public function updateStatus(Request $request, Building $building)
    {
        \Log::info('Payload recibido:', $request->all());
        \Log::info('Estado antes:', ['status' => $building->status]);

        $validated = $request->validate([
            'status' => 'required|boolean'
        ]);

        $building->update($validated);

        \Log::info('Estado después:', ['status' => $building->fresh()->status]);

        return back()->with('success', 'Estado actualizado');
    }
}
