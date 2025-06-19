<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Building;
use App\Models\Owner;
use App\Models\Doorman;

class BuildingSeeder extends Seeder
{
    public function run()
    {
        // Crear segundo building con diferente location_link
        $building2 = Building::create([
            'name' => 'Second Building',
            'description' => 'Second building for testing maps',
            'location_link' => 'https://maps.app.goo.gl/abcd1234567890xyz', // Link diferente
            'status' => true,
        ]);

        // Crear owner para el segundo building
        $building2->owner()->create([
            'name' => 'Second Owner',
            'email' => 'owner2@demo.com',
            'phone' => '987-654-3210',
        ]);

        // Crear doorman para el segundo building
        $building2->doormen()->create([
            'name' => 'Doorman 2',
            'email' => 'doorman2@demo.com',
            'phone' => '555-1234',
            'shift' => 'morning',
        ]);

        // Crear tercer building con coordenadas diferentes
        $building3 = Building::create([
            'name' => 'Third Building',
            'description' => 'Third building with coordinates',
            'location_link' => 'https://www.google.com/maps/@40.7128,-74.0060,15z', // Coordenadas de NYC
            'status' => true,
        ]);

        // Crear owner para el tercer building
        $building3->owner()->create([
            'name' => 'Third Owner',
            'email' => 'owner3@demo.com',
            'phone' => '111-222-3333',
        ]);
    }
}
