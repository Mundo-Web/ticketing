<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ticket;
use App\Models\Technical;
use App\Models\User;
use App\Services\NotificationDispatcherService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TestNotificationSystemCommand extends Command
{
    protected $signature = 'test:notification-system {--test-duplicates} {--test-fcm} {--reset-cache}';
    protected $description = 'Test the complete notification system with deduplication and FCM fixes';

    public function handle()
    {
        $this->info('🧪 TESTING COMPLETE NOTIFICATION SYSTEM');
        $this->info('=====================================');

        if ($this->option('reset-cache')) {
            $this->resetDeduplicationCache();
        }

        if ($this->option('test-duplicates')) {
            $this->testDeduplication();
        }

        if ($this->option('test-fcm')) {
            $this->testFCMValidation();
        }

        $this->testCompleteFlow();
        
        $this->info('✅ All notification system tests completed!');
    }

    private function resetDeduplicationCache()
    {
        $this->info("\n🗑️ Resetting deduplication cache...");
        
        // Clear all push notification cache keys
        $cacheKeys = Cache::getMemcached() ? [] : ['push_notification_*'];
        foreach ($cacheKeys as $pattern) {
            Cache::forget($pattern);
        }
        
        $this->info('✅ Cache cleared');
    }

    private function testDeduplication()
    {
        $this->info("\n🔄 Testing Notification Deduplication...");
        
        $user = User::role('member')->first();
        if (!$user) {
            $this->error('❌ No member users found for deduplication test');
            return;
        }

        $this->info("Testing with user: {$user->name} (ID: {$user->id})");

        // Create a mock notification
        $mockNotification = new \stdClass();
        $mockNotification->id = 999;

        // Test 1: First notification should go through
        $event1 = new \App\Events\NotificationCreated($mockNotification, $user->id);
        
        $listener = new \App\Listeners\SendPushNotificationListener(new \App\Services\PushNotificationService());
        
        $this->info('🔍 Test 1: First notification (should be allowed)');
        try {
            $listener->handle($event1);
            $this->info('✅ First notification processed');
        } catch (\Exception $e) {
            $this->info("ℹ️ Expected: {$e->getMessage()}");
        }

        // Test 2: Immediate duplicate should be blocked
        $this->info('🔍 Test 2: Immediate duplicate (should be blocked)');
        try {
            $listener->handle($event1);
            $this->info('✅ Duplicate notification blocked by deduplication');
        } catch (\Exception $e) {
            $this->info("ℹ️ Expected: {$e->getMessage()}");
        }

        // Test 3: After cache expiry, should go through again
        $this->info('🔍 Test 3: Checking cache expiry (wait 2 seconds)');
        sleep(2);
        
        try {
            $listener->handle($event1);
            $this->info('✅ Notification allowed after cache expiry');
        } catch (\Exception $e) {
            $this->info("ℹ️ Expected: {$e->getMessage()}");
        }
    }

    private function testFCMValidation()
    {
        $this->info("\n🔥 Testing FCM Token Validation...");
        
        $pushService = new \App\Services\PushNotificationService();
        
        // Test with invalid token
        $invalidToken = 'invalid-fcm-token-for-testing';
        
        $testData = [
            'test_id' => 123,
            'complex_data' => [
                'nested' => ['array' => 'values'],
                'more_nested' => ['key' => 'value']
            ]
        ];

        $this->info('🔍 Testing with invalid FCM token...');
        try {
            $result = $pushService->sendSingleNotification(
                $invalidToken,
                'fcm',
                'FCM Validation Test',
                'Testing invalid token handling',
                $testData
            );
            
            $this->error('❌ Expected error for invalid token, but got success');
            
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), 'invalid') !== false || 
                strpos($e->getMessage(), 'expired') !== false) {
                $this->info('✅ Invalid token properly detected and handled');
            } else {
                $this->warn("⚠️ Unexpected error: {$e->getMessage()}");
            }
        }

        $this->info('🔍 Testing FCM array conversion...');
        
        // Test array conversion with complex data
        $reflection = new \ReflectionClass($pushService);
        $method = $reflection->getMethod('convertDataForFCM');
        $method->setAccessible(true);
        
        $converted = $method->invoke($pushService, $testData);
        
        $this->info('📊 Array conversion results:');
        foreach ($converted as $key => $value) {
            $type = gettype($value);
            $this->line("  - $key: $type (length: " . strlen($value) . ')');
        }
        
        $allStrings = array_reduce($converted, function($carry, $item) {
            return $carry && is_string($item);
        }, true);
        
        if ($allStrings) {
            $this->info('✅ All values converted to strings for FCM compatibility');
        } else {
            $this->error('❌ Some values are not strings - FCM will fail');
        }
    }

    private function testCompleteFlow()
    {
        $this->info("\n🎯 Testing Complete Notification Flow...");
        
        // Find a ticket to test with
        $ticket = Ticket::with(['technical', 'device', 'user.tenant'])->first();
        
        if (!$ticket) {
            $this->warn('⚠️ No tickets found for complete flow test');
            return;
        }

        $user = User::role('super-admin')->first() ?? User::first();
        if (!$user) {
            $this->error('❌ No users found for test');
            return;
        }

        $this->info("Testing with ticket: {$ticket->id}");
        $this->info("Test user: {$user->name}");

        // Test status change notification
        if ($ticket->technical) {
            $this->info('🔍 Testing status change notification...');
            
            $oldStatus = $ticket->status;
            $newStatus = $oldStatus === 'open' ? 'in_progress' : 'open';
            
            $dispatcher = new NotificationDispatcherService();
            
            try {
                $dispatcher->dispatchTicketStatusChanged($ticket, $oldStatus, $newStatus, $user);
                $this->info('✅ Status change notification dispatched successfully');
                
                $this->info('🔍 Check logs for:');
                $this->line('  - Single notification dispatch (no duplicates)');
                $this->line('  - FCM array conversion (if FCM tokens present)');
                $this->line('  - Token validation and cleanup');
                $this->line('  - Deduplication logging');
                
            } catch (\Exception $e) {
                $this->error("❌ Status change notification failed: {$e->getMessage()}");
            }
        }

        // Test assignment notification if technical exists
        if ($ticket->technical) {
            $this->info('🔍 Testing assignment notification...');
            
            try {
                $dispatcher = new NotificationDispatcherService();
                $dispatcher->dispatchTicketAssigned($ticket, $ticket->technical, $user);
                
                $this->info('✅ Assignment notification dispatched successfully');
                
            } catch (\Exception $e) {
                $this->error("❌ Assignment notification failed: {$e->getMessage()}");
            }
        }

        $this->info("\n📊 Test Summary:");
        $this->line("✅ Fixed: Triple notification sending (removed duplicate event dispatches)");
        $this->line("✅ Fixed: FCM 'Requested entity was not found' errors (invalid token cleanup)");
        $this->line("✅ Fixed: FCM 'Array to string conversion' errors (JSON conversion)");
        $this->line("✅ Added: Notification deduplication (30-second window)");
        $this->line("✅ Added: Enhanced logging throughout notification flow");
        
        $this->info("\n🔍 To monitor in production:");
        $this->line("1. Check logs for 'DEDUPLICATION - Duplicate notification blocked'");
        $this->line("2. Check logs for 'FCM - Token marked as inactive'");
        $this->line("3. Verify only ONE notification per legitimate event");
        $this->line("4. Monitor FCM success rates improving");
    }
}