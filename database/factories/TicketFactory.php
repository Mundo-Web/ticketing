<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Support;
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

        $customer = Customer::factory()->create();
        $support = Support::factory()->create();

        return [
            'customer_id' => $customer->id,
            'support_id' => $support->id,
            'description' => $this->faker->sentence,
            'status' => $this->faker->randomElement(['Open', 'InProgress', 'Closed'])
        ];
    }
}
