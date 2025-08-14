<?php

namespace App\Console\Commands;

use App\Models\Technical;
use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class AssignChiefTechRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'chief-tech:assign-roles {--dry-run : Show what would be done without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign technical-leader role to all technicals with is_default = true';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        // Ensure the technical-leader role exists
        $chiefTechRole = Role::firstOrCreate(['name' => 'technical-leader']);
        
        if (!$isDryRun) {
            $this->info('Created/ensured technical-leader role exists');
        }

        // Find all default technicals
        $defaultTechnicals = Technical::where('is_default', true)->get();

        if ($defaultTechnicals->isEmpty()) {
            $this->warn('No default technicals found');
            return;
        }

        $this->info("Found {$defaultTechnicals->count()} default technical(s)");

        $assigned = 0;
        $alreadyAssigned = 0;

        foreach ($defaultTechnicals as $technical) {
            $user = User::where('email', $technical->email)->first();
            
            if (!$user) {
                $this->warn("User not found for technical: {$technical->email}");
                continue;
            }

            if ($user->hasRole('technical-leader')) {
                $alreadyAssigned++;
                $this->line("✓ {$technical->name} ({$technical->email}) already has technical-leader role");
                continue;
            }

            if ($isDryRun) {
                $this->line("Would assign technical-leader role to: {$technical->name} ({$technical->email})");
                $assigned++;
            } else {
                $user->assignRole('technical-leader');
                $this->info("✓ Assigned technical-leader role to: {$technical->name} ({$technical->email})");
                $assigned++;
            }
        }

        if ($isDryRun) {
            $this->info("\n[DRY RUN] Would assign {$assigned} Chief Tech roles");
            $this->info("Run without --dry-run to make actual changes");
        } else {
            $this->info("\nSummary:");
            $this->info("• Assigned roles: {$assigned}");
            $this->info("• Already assigned: {$alreadyAssigned}");
            $this->info("• Total default technicals: {$defaultTechnicals->count()}");
        }
    }
}
