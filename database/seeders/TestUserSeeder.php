<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Device;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    public function run()
    {
        // Crear un tenant de prueba
        $tenant = Tenant::create([
            'name' => 'Test Tenant',
            'email' => 'test@example.com',
            'phone' => '1234567890',
            'password' => Hash::make('password'),
            'document' => '12345678',
            'status' => 'active'
        ]);

        // Crear un usuario de prueba
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
        ]);

        // Asignar rol tenant al usuario
        $user->assignRole('tenant');

        // Asociar el tenant con el usuario
        $tenant->update(['user_id' => $user->id]);

        // Obtener algunos dispositivos y asociarlos con el tenant
        $devices = Device::take(2)->get();
        foreach ($devices as $device) {
            $device->tenants()->attach($tenant->id);
        }

        $this->command->info('Created test user: test@example.com / password');
        $this->command->info('Associated ' . $devices->count() . ' devices with the test tenant');
    }
}
