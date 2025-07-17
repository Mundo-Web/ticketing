<?php

namespace App\Console\Commands;

use App\Services\NinjaOneService;
use Illuminate\Console\Command;

class TestNinjaOneDeviceInfo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:ninjaone-device-info {name? : Device name to test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test fetching comprehensive device information from NinjaOne';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $deviceName = $this->argument('name') ?? 'DAMIANPC';
        
        $this->info("Testing NinjaOne API connection...");
        
        $ninjaOneService = app(NinjaOneService::class);
        
        if (!$ninjaOneService->testConnection()) {
            $this->error('NinjaOne API connection failed!');
            return 1;
        }
        
        $this->info('NinjaOne API connection successful!');
        
        // Find device by name
        $this->info("Searching for device with name: {$deviceName}");
        $deviceId = $ninjaOneService->findDeviceIdByName($deviceName);
        
        if (!$deviceId) {
            $this->error("Device '{$deviceName}' not found in NinjaOne");
            return 1;
        }
        
        $this->info("Device found in NinjaOne with ID: {$deviceId}");
        
        // Get comprehensive device information
        $this->info("Fetching comprehensive device information...");
        $deviceInfo = $ninjaOneService->getDeviceComprehensive($deviceId);
        
        if (!$deviceInfo) {
            $this->error("Failed to fetch comprehensive device information");
            return 1;
        }
        
        // Display basic device info
        $this->info("=== DEVICE INFORMATION ===");
        $device = $deviceInfo['device'];
        $this->table([
            'Field', 'Value'
        ], [
            ['ID', $device['id'] ?? 'N/A'],
            ['System Name', $device['systemName'] ?? 'N/A'],
            ['Display Name', $device['displayName'] ?? 'N/A'],
            ['DNS Name', $device['dnsName'] ?? 'N/A'],
            ['Node Class', $device['nodeClass'] ?? 'N/A'],
            ['Offline', $device['offline'] ? 'Yes' : 'No'],
            ['Last Contact', $device['lastContact'] ? date('Y-m-d H:i:s', $device['lastContact']) : 'N/A'],
            ['Approval Status', $device['approvalStatus'] ?? 'N/A'],
            ['Organization ID', $device['organizationId'] ?? 'N/A'],
            ['Location ID', $device['locationId'] ?? 'N/A'],
        ]);
        
        // Display health information
        $this->info("=== HEALTH STATUS ===");
        $health = $deviceInfo['health'];
        if ($health) {
            $this->table([
                'Field', 'Value'
            ], [
                ['Status', $health['status'] ?? 'N/A'],
                ['Issues Count', $health['issuesCount'] ?? 0],
                ['Critical Count', $health['criticalCount'] ?? 0],
                ['Warning Count', $health['warningCount'] ?? 0],
                ['Is Offline', $health['isOffline'] ? 'Yes' : 'No'],
                ['Last Contact', $health['lastContact'] ? date('Y-m-d H:i:s', $health['lastContact']) : 'N/A'],
                ['Last Checked', $health['lastChecked'] ?? 'N/A'],
            ]);
            
            // Display alerts if any
            if (!empty($health['alerts'])) {
                $this->info("=== ACTIVE ALERTS ===");
                $alertsTable = [];
                foreach ($health['alerts'] as $alert) {
                    $alertsTable[] = [
                        $alert['uid'] ?? 'N/A',
                        $alert['subject'] ?? 'N/A',
                        $alert['message'] ?? 'N/A',
                        $alert['severity'] ?? 'N/A',
                        $alert['sourceType'] ?? 'N/A',
                        $alert['createTime'] ? date('Y-m-d H:i:s', $alert['createTime']) : 'N/A',
                    ];
                }
                $this->table([
                    'UID', 'Subject', 'Message', 'Severity', 'Source Type', 'Created'
                ], $alertsTable);
            } else {
                $this->info('No active alerts found.');
            }
        } else {
            $this->warn('No health information available.');
        }
        
        // Display recent activities
        $this->info("=== RECENT ACTIVITIES ===");
        $activities = $deviceInfo['recentActivities'];
        if (!empty($activities['activities'])) {
            $activitiesTable = [];
            foreach (array_slice($activities['activities'], 0, 5) as $activity) {
                $activitiesTable[] = [
                    $activity['id'] ?? 'N/A',
                    $activity['activityType'] ?? 'N/A',
                    $activity['subject'] ?? 'N/A',
                    $activity['severity'] ?? 'N/A',
                    $activity['status'] ?? 'N/A',
                    $activity['activityTime'] ? date('Y-m-d H:i:s', $activity['activityTime']) : 'N/A',
                ];
            }
            $this->table([
                'ID', 'Type', 'Subject', 'Severity', 'Status', 'Time'
            ], $activitiesTable);
        } else {
            $this->info('No recent activities found.');
        }
        
        // Display running jobs
        $this->info("=== RUNNING JOBS ===");
        $jobs = $deviceInfo['runningJobs'];
        if (!empty($jobs)) {
            $jobsTable = [];
            foreach ($jobs as $job) {
                $jobsTable[] = [
                    $job['uid'] ?? 'N/A',
                    $job['jobType'] ?? 'N/A',
                    $job['subject'] ?? 'N/A',
                    $job['jobStatus'] ?? 'N/A',
                    $job['createTime'] ? date('Y-m-d H:i:s', $job['createTime']) : 'N/A',
                ];
            }
            $this->table([
                'UID', 'Type', 'Subject', 'Status', 'Created'
            ], $jobsTable);
        } else {
            $this->info('No running jobs found.');
        }
        
        // Display maintenance information
        if (isset($device['maintenance']) && $device['maintenance']) {
            $this->info("=== MAINTENANCE INFO ===");
            $maintenance = $device['maintenance'];
            $this->table([
                'Field', 'Value'
            ], [
                ['Status', $maintenance['status'] ?? 'N/A'],
                ['Start', $maintenance['start'] ? date('Y-m-d H:i:s', $maintenance['start']) : 'N/A'],
                ['End', $maintenance['end'] ? date('Y-m-d H:i:s', $maintenance['end']) : 'N/A'],
            ]);
        }
        
        $this->info("Device information fetched successfully!");
        
        return 0;
    }
}
