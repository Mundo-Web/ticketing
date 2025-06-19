<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use Illuminate\Console\Command;

/**
 * Command to delete tickets that do not have a valid code assigned.
 * 
 * This command helps maintain data integrity by removing tickets that 
 * somehow bypassed the automatic code generation process.
 * 
 * Usage examples:
 * - php artisan tickets:delete-without-code --dry-run (preview only)
 * - php artisan tickets:delete-without-code (with confirmation)
 * - php artisan tickets:delete-without-code --force (no confirmation)
 * 
 * Safety features:
 * - Dry-run mode to preview changes
 * - Confirmation prompt (unless --force is used)
 * - Detailed logging of actions
 * - Error handling for failed deletions
 * - Automatic cleanup of related ticket histories
 */
class DeleteTicketsWithoutCode extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:delete-without-code 
                            {--dry-run : Show which tickets would be deleted without actually deleting them}
                            {--force : Delete tickets without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete tickets that do not have a code assigned';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Buscar tickets sin código
        $ticketsWithoutCode = Ticket::whereNull('code')
            ->orWhere('code', '')
            ->orWhere('code', 'like', '%NULL%')
            ->get();

        if ($ticketsWithoutCode->isEmpty()) {
            $this->info('✅ No tickets found without code. All tickets have valid codes.');
            return 0;
        }

        $count = $ticketsWithoutCode->count();
        
        // Mostrar información de los tickets encontrados
        $this->warn("🔍 Found {$count} ticket(s) without code:");
        
        $headers = ['ID', 'Title', 'Status', 'Created At', 'Code'];
        $rows = $ticketsWithoutCode->map(function ($ticket) {
            return [
                $ticket->id,
                $ticket->title ? substr($ticket->title, 0, 30) . '...' : 'No title',
                $ticket->status,
                $ticket->created_at->format('Y-m-d H:i'),
                $ticket->code ?: '<empty>',
            ];
        })->toArray();

        $this->table($headers, $rows);

        // Modo dry-run: solo mostrar lo que se eliminaría
        if ($this->option('dry-run')) {
            $this->info("🔍 DRY RUN: {$count} ticket(s) would be deleted.");
            $this->comment('Run without --dry-run to actually delete the tickets.');
            return 0;
        }

        // Confirmar eliminación (a menos que se use --force)
        if (!$this->option('force')) {
            if (!$this->confirm("⚠️  Are you sure you want to delete {$count} ticket(s) without code? This action cannot be undone.")) {
                $this->info('❌ Operation cancelled.');
                return 0;
            }
        }

        // Eliminar tickets
        $this->info('🗑️  Deleting tickets without code...');
        
        $deletedCount = 0;
        $errors = [];

        foreach ($ticketsWithoutCode as $ticket) {
            try {
                // Eliminar historial del ticket primero (si existe)
                $ticket->histories()->delete();
                
                // Eliminar el ticket
                $ticket->delete();
                $deletedCount++;
                
                $this->line("✅ Deleted ticket ID: {$ticket->id} - {$ticket->title}");
            } catch (\Exception $e) {
                $errors[] = "❌ Failed to delete ticket ID: {$ticket->id} - Error: {$e->getMessage()}";
            }
        }

        // Mostrar resultados
        if ($deletedCount > 0) {
            $this->info("✅ Successfully deleted {$deletedCount} ticket(s) without code.");
        }

        if (!empty($errors)) {
            $this->error('❌ Some errors occurred:');
            foreach ($errors as $error) {
                $this->error($error);
            }
        }

        // Mostrar estadísticas finales
        $this->newLine();
        $this->info('📊 Summary:');
        $this->line("   - Tickets found without code: {$count}");
        $this->line("   - Successfully deleted: {$deletedCount}");
        $this->line("   - Errors: " . count($errors));

        return count($errors) > 0 ? 1 : 0;
    }
}
