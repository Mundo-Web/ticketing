<?php

use App\Models\User;
use App\Models\Technical;
use Spatie\Permission\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/dashboard')->assertOk();
});

test('super admin can access dashboard with metrics', function () {
    $role = Role::create(['name' => 'super-admin']);
    $user = User::factory()->create();
    $user->assignRole($role);
    
    $response = $this->actingAs($user)->get('/dashboard');
    
    $response->assertStatus(200);
});

test('technical default can access assign unassigned route', function () {
    $role = Role::create(['name' => 'technical']);
    $user = User::factory()->create();
    $user->assignRole($role);
    
    Technical::create([
        'name' => $user->name,
        'email' => $user->email,
        'phone' => '123-456-7890',
        'shift' => 'morning',
        'status' => true,
        'is_default' => true,
    ]);
    
    $response = $this->actingAs($user)->get('/tickets/assign-unassigned');
    
    // Should not be forbidden for default technical
    $response->assertStatus(200);
});

test('regular user cannot access assign unassigned route', function () {
    $role = Role::create(['name' => 'member']);
    $user = User::factory()->create();
    $user->assignRole($role);
    
    $response = $this->actingAs($user)->get('/tickets/assign-unassigned');
    
    $response->assertStatus(403);
});