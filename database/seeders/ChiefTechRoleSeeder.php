<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class ChiefTechRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create technical-leader role if it doesn't exist
        $chiefTechRole = Role::firstOrCreate(['name' => 'technical-leader']);

        // Create Chief Tech specific permissions
        $permissions = [
            // Team Management
            'manage-technicians',
            'assign-tickets-to-technicians',
            'view-all-technician-performance',
            'send-instructions-to-technicians',
            'update-technician-status',
            
            // Ticket Management
            'view-all-tickets',
            'assign-any-ticket',
            'bulk-assign-tickets',
            'prioritize-tickets',
            'view-ticket-analytics',
            
            // Appointment Management
            'schedule-any-appointment',
            'view-all-appointments',
            'reschedule-any-appointment',
            'cancel-any-appointment',
            
            // System Overview
            'view-system-metrics',
            'view-building-analytics',
            'view-device-status',
            'access-reports',
            
            // Administrative
            'access-chief-tech-dashboard',
            'export-team-data',
            'view-performance-analytics',
        ];

        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission]);
            $chiefTechRole->givePermissionTo($perm);
        }

        // Ensure technical-leader has all technical permissions plus additional ones
        $technicalRole = Role::firstOrCreate(['name' => 'technical']);
        
        // Give Chief Tech all technical permissions
        foreach ($technicalRole->permissions as $permission) {
            $chiefTechRole->givePermissionTo($permission);
        }

        $this->command->info('Chief Tech role and permissions created successfully');
    }
}
