<?php

namespace Database\Seeders;

use App\Models\Doorman;
use App\Models\Owner;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersFromEntitiesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Super Admin
        User::all()->each(function ($user) {
            if (!$user->hasRole('super-admin')) {
                $user->assignRole('super-admin');
            }
        });

        // Tenants
        Tenant::all()->each(function ($tenant) {
            $user = User::firstOrCreate([
                'email' => $tenant->email,
            ], [
                'name' => $tenant->name,
                'password' => Hash::make($tenant->email), // contraseña = email
            ]);
            $user->assignRole('member');
        });

        // Owners
        Owner::all()->each(function ($owner) {
            $user = User::firstOrCreate([
                'email' => $owner->email,
            ], [
                'name' => $owner->name,
                'password' => Hash::make($owner->email),
            ]);
            $user->assignRole('owner');
        });

        // Doormen
        Doorman::all()->each(function ($doorman) {
            $user = User::firstOrCreate([
                'email' => $doorman->email,
            ], [
                'name' => $doorman->name,
                'password' => Hash::make($doorman->email),
            ]);
            $user->assignRole('doorman');
        });
    }
}
