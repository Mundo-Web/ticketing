<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Technical;
use App\Models\Building;
use App\Models\Owner;
use App\Models\Apartment;
use App\Models\Tenant;
use App\Models\Brand;
use App\Models\DeviceModel;
use App\Models\System;
use App\Models\NameDevice;
use App\Models\Device;
use App\Models\Ticket;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DemoTechnicalSeeder extends Seeder
{
    public function run(): void
    {
        // Create technical role if not exists
        $technicalRole = Role::firstOrCreate(['name' => 'technical']);
        $memberRole = Role::firstOrCreate(['name' => 'member']);

        // Create a technical user
        $technicalUser = User::firstOrCreate([
            'email' => 'technical@adk.com',
        ], [
            'name' => 'Technical ADK',
            'password' => Hash::make('password'),
        ]);

        if (!$technicalUser->hasRole('technical')) {
            $technicalUser->assignRole('technical');
        }

        // Create technical record
        $technical = Technical::firstOrCreate([
            'email' => 'technical@adk.com',
        ], [
            'name' => 'Technical ADK',
            'phone' => '123-456-7890',
            'shift' => 'morning',
            'status' => true,
            'is_default' => true,
        ]);

        // Create a member user
        $memberUser = User::firstOrCreate([
            'email' => 'member@adk.com',
        ], [
            'name' => 'Member ADK',
            'password' => Hash::make('password'),
        ]);

        if (!$memberUser->hasRole('member')) {
            $memberUser->assignRole('member');
        }

        // Create basic entities for tickets - much simpler
        $building = Building::firstOrCreate([
            'name' => 'Demo Building',
        ], [
            'description' => 'Demo building for testing',
            'location_link' => 'https://maps.google.com',
        ]);

        // Create owner with building_id
        $owner = Owner::firstOrCreate([
            'email' => 'owner@demo.com',
        ], [
            'name' => 'Demo Owner',
            'phone' => '123-456-7890',
            'building_id' => $building->id,
        ]);

        $apartment = Apartment::firstOrCreate([
            'name' => 'Apt 101',
        ], [
            'ubicacion' => 'First floor',
            'buildings_id' => $building->id,
        ]);

        $tenant = Tenant::firstOrCreate([
            'name' => 'Demo Tenant',
        ], [
            'email' => 'tenant@demo.com',
            'phone' => '123-456-7890',
            'apartment_id' => $apartment->id,
        ]);

        // Create device components
        $brand = Brand::firstOrCreate(['name' => 'Demo Brand']);
        $model = DeviceModel::firstOrCreate(['name' => 'Demo Model'], ['brand_id' => $brand->id]);
        $system = System::firstOrCreate(['name' => 'Demo System']);
        $nameDevice = NameDevice::firstOrCreate(['name' => 'Demo Device Type']);

        $device = Device::firstOrCreate([
            'name' => 'Demo Device 001',
        ], [
            'brand_id' => $brand->id,
            'model_id' => $model->id,
            'system_id' => $system->id,
            'name_device_id' => $nameDevice->id,
            'description' => 'Demo device for testing',
            'apartment_id' => $apartment->id,
        ]);

        // Create tickets
        $statuses = ['open', 'in_progress', 'resolved', 'closed'];
        $categories = ['Hardware', 'Software', 'Network', 'Maintenance'];

        for ($i = 1; $i <= 10; $i++) {
            $status = $statuses[array_rand($statuses)];
            
            Ticket::firstOrCreate([
                'code' => 'TCK-' . str_pad($i, 5, '0', STR_PAD_LEFT),
            ], [
                'title' => "Demo Ticket #{$i}",
                'user_id' => $memberUser->id,
                'device_id' => $device->id,
                'category' => $categories[array_rand($categories)],
                'description' => "This is a demo ticket #{$i} for testing purposes.",
                'status' => $status,
                'technical_id' => $status === 'open' ? null : ($i % 3 === 0 ? null : $technical->id),
            ]);
        }

        $this->command->info('Demo data created successfully!');
        $this->command->info('Super Admin: superadmin@adk.com / Web#Assist$Adk7_P4');
        $this->command->info('Technical: technical@adk.com / password');
        $this->command->info('Member: member@adk.com / password');
    }
}
