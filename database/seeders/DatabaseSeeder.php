<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\App;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {

      
        // Primero ejecutar el seeder de roles y permisos
        $this->call(RolesAndPermissionsSeeder::class);
        
        // Crear el usuario super-admin
        $this->call(SuperAdminSeeder::class);
        
        // Crear datos de ejemplo
        // \App\Models\Support::factory(5)->create();
        // \App\Models\Ticket::factory(15)->create();
        
        // Crear usuarios desde entidades existentes
        $this->call(UsersFromEntitiesSeeder::class);
        // User::factory(10)->create();

        /*
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
        */
    }
}
