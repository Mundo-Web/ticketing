<?php

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Test simple para debuggear creación de tickets
 */

try {
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    echo "=== DEBUGGING TICKET CREATION ===\n\n";

    // Usar la alerta existente
    $alert = App\Models\NinjaOneAlert::find(7);
    if (!$alert) {
        echo "Alert not found\n";
        return;
    }

    echo "Alert found: {$alert->title}\n";
    echo "Alert status: {$alert->status}\n";
    echo "Ticket created: " . ($alert->ticket_created ? 'Yes' : 'No') . "\n";

    // Intentar crear un ticket directamente
    try {
        $ticket = App\Models\Ticket::create([
            'title' => 'Test Ticket Direct Creation',
            'description' => 'Testing direct ticket creation',
            'priority' => 'normal',
            'status' => 'open',
            'tenant_id' => 190,
            'device_id' => $alert->device_id,
            'source' => 'test',
            'metadata' => [
                'test' => true
            ]
        ]);

        echo "✓ Ticket created successfully: ID {$ticket->id}\n";

    } catch (\Exception $e) {
        echo "✗ Ticket creation failed: " . $e->getMessage() . "\n";
        echo "Fields in tickets table:\n";
        
        // Ver estructura de la tabla tickets
        $columns = \Illuminate\Support\Facades\DB::select('DESCRIBE tickets');
        foreach ($columns as $column) {
            echo "  - {$column->Field} ({$column->Type}) " . ($column->Null === 'NO' ? 'REQUIRED' : 'OPTIONAL') . "\n";
        }
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}