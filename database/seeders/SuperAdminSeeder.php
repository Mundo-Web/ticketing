<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Asegurar que el rol super-admin existe
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);

        // Crear usuario super-admin
        $superAdmin = User::firstOrCreate([
            'email' => 'superadmin@adk.com',
        ], [
            'name' => 'ADK ASSIST',
            'password' => Hash::make('Web#Assist$Adk7_P4'),
        ]);

        // Asignar el rol super-admin
        if (!$superAdmin->hasRole('super-admin')) {
            $superAdmin->assignRole('super-admin');
        }

    }
}
