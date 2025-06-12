<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Get random user and device from existing ones (or create if needed)
        $user = User::inRandomOrder()->first() ?? User::factory()->create();
        $device = Device::inRandomOrder()->first() ?? Device::factory()->create();

        return [
            'user_id' => $user->id,
            'device_id' => $device->id,
            'category' => $this->faker->randomElement(['Hardware', 'Software', 'Network', 'Maintenance']),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph,
            'status' => $this->faker->randomElement(['open', 'in_progress', 'resolved', 'closed'])
        ];
    }
}
