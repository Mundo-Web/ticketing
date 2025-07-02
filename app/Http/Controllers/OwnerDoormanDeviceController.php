<?php

namespace App\Http\Controllers;

use App\Models\Owner;
use App\Models\Doorman;
use App\Models\Tenant;
use App\Models\Device;
use App\Models\Building;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OwnerDoormanDeviceController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $building = null;
        $members = collect();
        $devices = collect();

        // Determinar el building del usuario
        if ($user->hasRole('owner')) {
            $owner = Owner::where('email', $user->email)->with('building')->first();
            if ($owner) {
                $building = $owner->building;
            }
        } elseif ($user->hasRole('doorman')) {
            $doorman = Doorman::where('email', $user->email)->with('building')->first();
            if ($doorman) {
                $building = $doorman->building;
            }
        }

        if (!$building) {
            abort(403, 'No building assigned to user');
        }

        // Obtener todos los members del building
        $members = Tenant::whereHas('apartment', function($query) use ($building) {
            $query->where('buildings_id', $building->id);
        })->with(['apartment', 'devices.name_device', 'devices.brand', 'devices.model', 'devices.system'])->get();

        // Obtener todos los devices de los members del building
        $devices = Device::whereHas('owner.apartment', function($query) use ($building) {
            $query->where('buildings_id', $building->id);
        })->with([
            'name_device',
            'brand',
            'model',
            'system',
            'owner.apartment'
        ])->get();

        return Inertia::render('Devices/OwnerDoormanIndex', [
            'building' => $building,
            'members' => $members,
            'devices' => $devices,
            'userRole' => $user->hasRole('owner') ? 'owner' : 'doorman',
        ]);
    }
}
