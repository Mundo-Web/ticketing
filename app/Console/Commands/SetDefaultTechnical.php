<?php

namespace App\Console\Commands;

use App\Models\Technical;
use Illuminate\Console\Command;

class SetDefaultTechnical extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'technical:set-default {id : The ID of the technical to set as default}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set a technical as the default one';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $technicalId = $this->argument('id');
        
        $technical = Technical::find($technicalId);
        
        if (!$technical) {
            $this->error("Technical with ID {$technicalId} not found.");
            return 1;
        }
        
        // Remove default from all technicals
        Technical::where('is_default', true)->update(['is_default' => false]);
        
        // Set the new default
        $technical->update(['is_default' => true]);
        
        $this->info("Technical '{$technical->name}' has been set as default.");
        
        return 0;
    }
}
