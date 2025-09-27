<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Ticket;
use App\Models\PushToken;
use App\Events\NotificationCreated;
use App\Services\NotificationDispatcherService;
use App\Services\PushNotificationService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;

class TestFCMFixCommand extends Command
{
    protected $signature = 'test:fcm-fix {--direct-test}';
    protected $description = 'Test FCM array conversion fix with enhanced logging';

    public function handle()
    {
        $this->info('🧪 TESTING FCM ARRAY CONVERSION FIX');
        $this->info('====================================');

        // Test 1: Direct array conversion
        $this->testArrayConversion();

        if ($this->option('direct-test')) {
            // Test 2: Direct service test
            $this->testDirectNotification();
        } else {
            // Test 3: Full notification flow
            $this->testFullNotificationFlow();
        }

        $this->info('✅ FCM Fix Test Complete!');
        $this->info('🔍 Check logs: php artisan log:tail --lines=50');
    }

    private function testArrayConversion()
    {
        $this->info("\n🔄 Testing Array to String Conversion for FCM...");
        
        // Complex nested data that was causing FCM errors
        $complexData = [
            'ticket_id' => 123,
            'device' => [
                'id' => 456,
                'name' => 'JULIOPC',
                'brand' => ['name' => 'Dell', 'model' => 'Inspiron']
            ],
            'technical' => [
                'id' => 789,
                'name' => 'Tech User',
                'phone' => '+1234567890'
            ],
            'tenant' => [
                'name' => 'John Doe',
                'apartment' => [
                    'number' => 'A-101',
                    'building' => ['name' => 'Main Building']
                ]
            ],
            'metadata' => ['priority' => 'high', 'tags' => ['urgent', 'hardware']]
        ];

        $this->info('📦 Original data has nested arrays');
        foreach ($complexData as $key => $value) {
            $type = is_array($value) ? 'array' : gettype($value);
            $this->line("  - $key: $type");
        }

        // Test the conversion
        $pushService = new PushNotificationService();
        $reflection = new \ReflectionClass($pushService);
        $method = $reflection->getMethod('convertDataForFCM');
        $method->setAccessible(true);
        
        $fcmData = $method->invoke($pushService, $complexData);

        $this->info('📤 After FCM conversion - all strings:');
        foreach ($fcmData as $key => $value) {
            $this->line("  - $key: " . gettype($value) . " (length: " . strlen($value) . ")");
        }

        $this->info('✅ Conversion successful - FCM should accept this data');
    }

    private function testDirectNotification()
    {
        $this->info("\n📱 Testing Direct Notification Send...");

        // Find active push tokens
        $pushTokens = PushToken::active()->limit(5)->get();
        
        if ($pushTokens->isEmpty()) {
            $this->warn('❌ No active push tokens found');
            return;
        }

        $this->info("✅ Found {$pushTokens->count()} active push tokens");

        // Create test data with arrays
        $testData = [
            'ticket_id' => 999,
            'device_info' => [
                'name' => 'TEST-DEVICE',
                'brand' => ['name' => 'Test Brand']
            ],
            'location' => [
                'building' => 'Test Building',
                'apartment' => 'A-101'
            ]
        ];

        $pushService = new PushNotificationService();
        
        foreach ($pushTokens as $pushToken) {
            $tokenType = $pushToken->token_type;
            $this->info("🔍 Testing $tokenType token (tenant: {$pushToken->tenant_id})...");
            
            try {
                $result = $pushService->sendSingleNotification(
                    $pushToken->push_token,
                    $tokenType,
                    'FCM Fix Test',
                    'Testing array conversion fix',
                    $testData
                );
                
                $this->info("✅ " . strtoupper($tokenType) . " notification sent successfully");
                $this->line("   Service: {$result['service']}");
                
            } catch (\Exception $e) {
                $this->error("❌ $tokenType error: " . $e->getMessage());
            }
        }
    }

    private function testFullNotificationFlow()
    {
        $this->info("\n🎫 Testing Full Notification Flow...");

        // Find a tenant with push tokens
        $tenant = \App\Models\Tenant::whereHas('pushTokens', function($query) {
            $query->where('is_active', true);
        })->first();
        
        if (!$tenant) {
            $this->warn('❌ No tenants with push tokens found');
            $this->info('Creating direct notification test...');
            
            // Create a test user for the notification
            $testUser = User::first();
            if (!$testUser) {
                $this->error('❌ No users found in database');
                return;
            }

            $testData = [
                'ticket_id' => 999,
                'device' => [
                    'name' => 'TEST-DEVICE',
                    'brand' => ['name' => 'Test Brand']
                ],
                'technical' => [
                    'name' => 'Test Tech',
                    'phone' => '+1234567890'
                ],
                'tenant' => [
                    'name' => 'Test Tenant',
                    'apartment' => [
                        'number' => 'A-101',
                        'building' => ['name' => 'Test Building']
                    ]
                ]
            ];

            Event::dispatch(new NotificationCreated(
                $testUser,
                'ticket_assigned',
                'FCM Fix Test',
                'Testing complete notification flow with nested data',
                $testData
            ));

            $this->info('✅ Direct notification event dispatched');
            return;
        }

        $this->info("✅ Found tenant with push tokens: {$tenant->name}");
        $this->info("📱 Push tokens: {$tenant->pushTokens->count()}");

        // Try to find a ticket with complete relations
        $ticket = Ticket::with(['device.brand', 'technical', 'tenant.apartment.building'])
                         ->whereNotNull('technical_id')
                         ->first();

        if ($ticket && $ticket->technical) {
            $this->info("🎫 Using real ticket: {$ticket->id}");
            $this->info("📋 Device: {$ticket->device->name}");
            $this->info("👤 Technical: {$ticket->technical->name}");
            
            $dispatcher = new NotificationDispatcherService();
            
            // We need a user to dispatch the notification
            $user = User::first();
            if (!$user) {
                $this->error('❌ No users found');
                return;
            }
            
            $dispatcher->dispatchTicketAssigned($ticket, $ticket->technical, $user);
            
        } else {
            $this->info('❌ No tickets with technical assignment found');
        }

        $this->info('✅ Notification flow initiated - check logs for 8-stage process');
    }
}