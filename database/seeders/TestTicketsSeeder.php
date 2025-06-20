<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ticket;

class TestTicketsSeeder extends Seeder
{
    public function run()
    {
        // Crear ticket cerrado
        $ticket1 = Ticket::create([
            'user_id' => 1,
            'device_id' => 1,
            'category' => 'Testing',
            'title' => 'Test Closed Ticket',
            'description' => 'This is a test closed ticket',
            'status' => 'closed',
            'closed_at' => now()
        ]);

        // Crear otro ticket cancelado
        $ticket2 = Ticket::create([
            'user_id' => 1,
            'device_id' => 1,
            'category' => 'Testing', 
            'title' => 'Test Cancelled Ticket 2',
            'description' => 'This is another test cancelled ticket',
            'status' => 'cancelled'
        ]);

        $this->command->info("Created ticket #{$ticket1->id} with status: {$ticket1->status}");
        $this->command->info("Created ticket #{$ticket2->id} with status: {$ticket2->status}");
    }
}
