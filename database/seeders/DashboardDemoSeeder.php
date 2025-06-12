<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardDemoSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */    public function run(): void
    {
        $this->command->info('🚀 Generando tickets de demostración para el dashboard...');

        // Verificar usuarios, técnicos y dispositivos existentes
        $userCount = DB::table('users')->count();
        $technicalCount = DB::table('technicals')->count();
        $deviceCount = DB::table('devices')->count();

        if ($userCount == 0) {
            $this->command->error('No hay usuarios en la base de datos. Ejecuta primero los seeders básicos.');
            return;
        }

        $this->command->info("📊 Usuarios disponibles: {$userCount}");
        $this->command->info("👨‍🔧 Técnicos disponibles: {$technicalCount}");
        $this->command->info("📱 Dispositivos disponibles: {$deviceCount}");

        // Generar tickets para los últimos 7 días con diferentes estados
        $statuses = ['open', 'in_progress', 'resolved', 'closed'];
        $categories = ['Electricidad', 'Plomería', 'HVAC', 'Seguridad', 'Mantenimiento', 'Internet'];

        for ($i = 0; $i < 7; $i++) {
            $date = Carbon::now()->subDays($i);
            $ticketsToday = rand(2, 8);

            for ($j = 0; $j < $ticketsToday; $j++) {
                $status = $statuses[array_rand($statuses)];
                $category = $categories[array_rand($categories)];
                
                $ticketData = [
                    'title' => "Problema de {$category} - " . $date->format('d/m/Y'),
                    'description' => "Descripción detallada del problema de {$category} reportado el " . $date->format('d/m/Y'),
                    'status' => $status,
                    'category' => $category,
                    'user_id' => rand(1, $userCount),
                    'created_at' => $date->copy()->addHours(rand(8, 20))->addMinutes(rand(0, 59)),
                    'updated_at' => $date->copy()->addHours(rand(8, 20))->addMinutes(rand(0, 59)),
                ];

                // Si está resuelto, agregar fecha de resolución
                if ($status === 'resolved') {
                    $ticketData['resolved_at'] = $date->copy()->addHours(rand(1, 48));
                }

                // Asignar técnico aleatoriamente solo si hay técnicos
                if ($technicalCount > 0 && in_array($status, ['in_progress', 'resolved'])) {
                    $ticketData['technical_id'] = rand(1, $technicalCount);
                }

                // Asignar dispositivo aleatoriamente solo si hay dispositivos
                if ($deviceCount > 0) {
                    $ticketData['device_id'] = rand(1, $deviceCount);
                }

                Ticket::create($ticketData);
            }
        }

        $this->command->info('✅ Se han generado tickets de demostración para mostrar las gráficas del dashboard');
        $this->command->info('📊 El dashboard ahora mostrará datos visuales más ricos');
        
        // Mostrar estadísticas
        $totalTickets = Ticket::count();
        $openTickets = Ticket::where('status', 'open')->count();
        $resolvedTickets = Ticket::where('status', 'resolved')->count();
        
        $this->command->info("📈 Total de tickets: {$totalTickets}");
        $this->command->info("🔓 Tickets abiertos: {$openTickets}");
        $this->command->info("✅ Tickets resueltos: {$resolvedTickets}");
    }
}
