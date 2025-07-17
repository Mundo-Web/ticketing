<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NinjaOneService;
use Exception;

class TestDamianPCAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:damianpc-alerts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test DAMIANPC device alerts to verify structure';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing DAMIANPC device data...');
        
        try {
            $ninjaOneService = new NinjaOneService();
            
            // Test 1: Search all devices for DAMIANPC
            $this->info('1. Searching for DAMIANPC in all devices...');
            $allDevices = $ninjaOneService->getAllDevices();
            $this->info("Found " . count($allDevices) . " total devices");
            
            $damianPCDevices = array_filter($allDevices, function($device) {
                return isset($device['systemName']) && stripos($device['systemName'], 'DAMIANPC') !== false;
            });
            
            $this->info("Found " . count($damianPCDevices) . " devices with DAMIANPC in systemName");
            
            if (count($damianPCDevices) > 0) {
                $device = reset($damianPCDevices);
                $this->info('DAMIANPC device found:');
                $this->line("  ID: " . ($device['id'] ?? 'N/A'));
                $this->line("  systemName: " . ($device['systemName'] ?? 'N/A'));
                $this->line("  displayName: " . ($device['displayName'] ?? 'N/A'));
                $this->line("  status: " . ($device['status'] ?? 'N/A'));
                
                // Test 2: Get device alerts for this specific device
                $deviceId = $device['id'] ?? null;
                if ($deviceId) {
                    $this->info('2. Getting alerts for device ID: ' . $deviceId);
                    $deviceAlerts = $ninjaOneService->getDeviceAlerts($deviceId);
                    $this->info("Found " . count($deviceAlerts) . " alerts for DAMIANPC device");
                    
                    if (count($deviceAlerts) > 0) {
                        $this->info('Device alerts:');
                        foreach (array_slice($deviceAlerts, 0, 3) as $i => $alert) {
                            $this->line("Alert $i:");
                            $this->line("  Type: " . ($alert['type'] ?? 'N/A'));
                            $this->line("  Status: " . ($alert['status'] ?? 'N/A'));
                            $this->line("  Message: " . ($alert['message'] ?? 'N/A'));
                            $this->line("---");
                        }
                    }
                    
                    // Test 3: Get device activities
                    $this->info('3. Getting activities for DAMIANPC device...');
                    $activities = $ninjaOneService->getDeviceActivities($deviceId);
                    $this->info("Found " . count($activities) . " activities for DAMIANPC");
                    
                    if (count($activities) > 0) {
                        $this->info('Recent activities:');
                        foreach (array_slice($activities, 0, 5) as $i => $activity) {
                            $this->line("Activity $i:");
                            $this->line("  Type: " . ($activity['type'] ?? 'N/A'));
                            $this->line("  Status: " . ($activity['status'] ?? 'N/A'));
                            $this->line("  Message: " . ($activity['message'] ?? 'N/A'));
                            $this->line("  Date: " . ($activity['timestamp'] ?? 'N/A'));
                            $this->line("---");
                        }
                    }
                    
                    // Test 4: Get device health status
                    $this->info('4. Getting health status for DAMIANPC device...');
                    $health = $ninjaOneService->getDeviceHealthStatus($deviceId);
                    if ($health) {
                        $this->info('Health status:');
                        $this->line("  Status: " . ($health['status'] ?? 'N/A'));
                        $this->line("  Health: " . ($health['health'] ?? 'N/A'));
                        $this->line("  Issues: " . ($health['issues'] ?? 'N/A'));
                    }
                }
            }
            
            // Test 5: Search by name in different ways
            $this->info('5. Alternative search methods...');
            
            // Check if we can find it by partial name
            $partialMatches = array_filter($allDevices, function($device) {
                $systemName = $device['systemName'] ?? '';
                $displayName = $device['displayName'] ?? '';
                return stripos($systemName, 'DAMIAN') !== false || stripos($displayName, 'DAMIAN') !== false;
            });
            
            $this->info("Found " . count($partialMatches) . " devices with 'DAMIAN' in name");
            
            if (count($partialMatches) > 0) {
                $this->info('Partial matches:');
                foreach ($partialMatches as $device) {
                    $this->line("  - " . ($device['systemName'] ?? 'N/A') . " | " . ($device['displayName'] ?? 'N/A'));
                }
            }
            
            // Test 6: Check if DAMIANPC is in our database
            $this->info('6. Checking DAMIANPC in database...');
            $device = \App\Models\Device::where('name', 'DAMIANPC')->first();
            if ($device) {
                $this->info('Found DAMIANPC device in database:');
                $this->line("  ID: " . $device->id);
                $this->line("  Name: " . $device->name);
                $this->line("  NinjaOne enabled: " . ($device->ninjaone_enabled ? 'Yes' : 'No'));
                $this->line("  NinjaOne device ID: " . ($device->ninjaone_device_id ?? 'None'));
                $this->line("  Tenant ID: " . ($device->tenant_id ?? 'None'));
                
                // Enable NinjaOne if not enabled
                if (!$device->ninjaone_enabled) {
                    $this->info('Enabling NinjaOne for DAMIANPC...');
                    $device->ninjaone_enabled = true;
                    $device->save();
                    $this->line("  NinjaOne enabled: " . ($device->ninjaone_enabled ? 'Yes' : 'No'));
                }
            } else {
                $this->error('DAMIANPC device not found in database');
                $this->info('Available devices in database:');
                $allDbDevices = \App\Models\Device::all();
                foreach ($allDbDevices as $device) {
                    $this->line("  - " . $device->name . " (ID: " . $device->id . ")");
                }
            }
            
            // Test 7: Now test the actual alert API
            $this->info('7. Testing getUserDeviceAlerts API...');
            $this->info('Creating a test user for DAMIANPC tenant...');
            
            // Find a tenant that has DAMIANPC
            $damianDevice = \App\Models\Device::where('name', 'DAMIANPC')->first();
            if ($damianDevice) {
                // Update tenant_id if needed
                if (!$damianDevice->tenant_id) {
                    $firstTenant = \App\Models\Tenant::first();
                    if ($firstTenant) {
                        $damianDevice->tenant_id = $firstTenant->id;
                        $damianDevice->save();
                        $this->info('Updated DAMIANPC tenant_id to: ' . $firstTenant->id);
                    }
                }
                
                // Now simulate getting user device alerts
                $this->info('Simulating user device alerts for DAMIANPC...');
                
                // Mock user with tenant
                $tenant = \App\Models\Tenant::find($damianDevice->tenant_id);
                if ($tenant) {
                    $this->info('Found tenant: ' . $tenant->name . ' (ID: ' . $tenant->id . ')');
                    
                    // Get devices for this tenant
                    $tenantDevices = \App\Models\Device::where('tenant_id', $tenant->id)
                        ->where('ninjaone_enabled', true)
                        ->get();
                    
                    $this->info('Found ' . count($tenantDevices) . ' NinjaOne-enabled devices for tenant');
                    
                    foreach ($tenantDevices as $device) {
                        $this->line("  Device: " . $device->name . " (NinjaOne ID: " . ($device->ninjaone_device_id ?? 'None') . ")");
                        
                        // Test getting health status
                        if ($device->ninjaone_device_id) {
                            $healthInfo = $ninjaOneService->getDeviceHealthStatus($device->ninjaone_device_id);
                            if ($healthInfo) {
                                $this->line("    Health: " . ($healthInfo['status'] ?? 'N/A'));
                                $this->line("    Issues: " . ($healthInfo['issuesCount'] ?? 0));
                                
                                // Check if this would trigger an alert
                                $wouldAlert = $healthInfo['status'] !== 'healthy' && $healthInfo['status'] !== 'online';
                                $this->line("    Would trigger alert: " . ($wouldAlert ? 'YES' : 'NO'));
                            }
                        }
                    }
                }
            }
            
        } catch (Exception $e) {
            $this->error("Error: " . $e->getMessage());
            $this->error("Stack trace:");
            $this->error($e->getTraceAsString());
        }
        
        $this->info('Test completed!');
    }
}
