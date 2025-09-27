<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Tenant;
use App\Models\PushToken;
use App\Services\PushNotificationService;
use Illuminate\Support\Facades\Log;

class TestPushTokensCommand extends Command
{
    protected $signature = 'test:push-tokens {--create-test-tokens} {--send-fcm-test}';
    protected $description = 'Test push tokens and FCM functionality';

    public function handle()
    {
        $this->info('🔍 PUSH TOKENS ANALYSIS');
        $this->info('=======================');

        if ($this->option('create-test-tokens')) {
            $this->createTestTokens();
        }

        $this->analyzePushTokens();

        if ($this->option('send-fcm-test')) {
            $this->testFCMNotifications();
        }
    }

    private function createTestTokens()
    {
        $this->info("\n🔧 Creating test push tokens...");

        // Find a tenant to associate tokens with
        $tenant = Tenant::first();
        
        if (!$tenant) {
            $this->error('❌ No tenants found. Cannot create test tokens.');
            return;
        }

        // Create test FCM token
        $fcmToken = PushToken::create([
            'tenant_id' => $tenant->id,
            'push_token' => 'fcm-test-token-' . time(),
            'platform' => 'android',
            'device_name' => 'Test Android Device',
            'device_type' => 'mobile',
            'is_active' => true,
            'token_type' => 'fcm',
            'app_ownership' => 'standalone',
            'is_standalone' => true,
            'execution_environment' => 'standalone'
        ]);

        // Create test Expo token  
        $expoToken = PushToken::create([
            'tenant_id' => $tenant->id,
            'push_token' => 'ExponentPushToken[test-expo-token-' . time() . ']',
            'platform' => 'ios',
            'device_name' => 'Test iOS Device',
            'device_type' => 'mobile',
            'is_active' => true,
            'token_type' => 'expo',
            'app_ownership' => 'expo',
            'is_standalone' => false,
            'execution_environment' => 'expo'
        ]);

        $this->info("✅ Created test tokens:");
        $this->info("   FCM Token ID: {$fcmToken->id}");
        $this->info("   Expo Token ID: {$expoToken->id}");
        $this->info("   Associated with tenant: {$tenant->name} (ID: {$tenant->id})");
    }

    private function analyzePushTokens()
    {
        $totalTokens = PushToken::count();
        $activeTokens = PushToken::active()->count();
        $fcmTokens = PushToken::fcm()->count();
        $expoTokens = PushToken::expo()->count();

        $this->info("\n📊 Push Tokens Statistics:");
        $this->info("   Total tokens: $totalTokens");
        $this->info("   Active tokens: $activeTokens");
        $this->info("   FCM tokens: $fcmTokens");
        $this->info("   Expo tokens: $expoTokens");

        if ($activeTokens > 0) {
            $this->info("\n📱 Active tokens details:");
            
            $tokens = PushToken::active()->with('tenant')->get();
            
            foreach ($tokens as $token) {
                $this->info("   Token #{$token->id}:");
                $this->info("     Type: {$token->token_type}");
                $this->info("     Platform: {$token->platform}");
                $this->info("     Device: {$token->device_name}");
                $tenantName = $token->tenant ? $token->tenant->name : 'N/A';
                $this->info("     Tenant: $tenantName (ID: {$token->tenant_id})");
                $this->info("     Token preview: " . substr($token->push_token, 0, 30) . "...");
                $this->info("");
            }
        }
    }

    private function testFCMNotifications()
    {
        $this->info("\n🚀 Testing FCM Notifications with Array Conversion...");

        $activeTokens = PushToken::active()->get();
        
        if ($activeTokens->isEmpty()) {
            $this->warn('❌ No active tokens found. Run with --create-test-tokens first');
            return;
        }

        // Create complex test data with nested arrays (what was causing FCM errors)
        $complexTestData = [
            'ticket_id' => 123,
            'device_info' => [
                'name' => 'JULIOPC-TEST',
                'brand' => [
                    'name' => 'Dell',
                    'model' => 'Inspiron 15'
                ],
                'specifications' => [
                    'ram' => '16GB',
                    'storage' => '512GB SSD',
                    'processor' => 'Intel i7'
                ]
            ],
            'technical_info' => [
                'id' => 456,
                'name' => 'John Tech',
                'phone' => '+1234567890',
                'specialties' => ['hardware', 'software', 'networking']
            ],
            'location_info' => [
                'tenant' => 'Test Tenant',
                'apartment' => [
                    'number' => 'A-101',
                    'floor' => '1st Floor',
                    'building' => [
                        'name' => 'Main Building',
                        'address' => '123 Test St'
                    ]
                ]
            ],
            'metadata' => [
                'priority' => 'high',
                'created_at' => now()->toISOString(),
                'tags' => ['urgent', 'hardware', 'desktop'],
                'estimated_duration' => 60
            ]
        ];

        $pushService = new PushNotificationService();

        foreach ($activeTokens as $token) {
            $this->info("🔍 Testing {$token->token_type} notification...");
            $this->info("   Device: {$token->device_name}");
            $tenantName = $token->tenant ? $token->tenant->name : 'N/A';
            $this->info("   Tenant: $tenantName");

            try {
                $result = $pushService->sendSingleNotification(
                    $token->push_token,
                    $token->token_type,
                    'FCM Array Fix Test',
                    'Testing complex nested data with FCM array conversion fix',
                    $complexTestData
                );

                $this->info("✅ {$token->token_type} notification sent successfully!");
                $this->info("   Service used: {$result['service']}");
                $this->info("   Token type detected: {$result['token_type']}");

            } catch (\Exception $e) {
                $this->error("❌ {$token->token_type} notification failed:");
                $this->error("   Error: {$e->getMessage()}");
            }

            $this->info("");
        }

        $this->info("🔍 Check logs for detailed FCM array conversion process:");
        $this->info("   Logs should show:");
        $this->info("   1. 📦 Original data with nested arrays");
        $this->info("   2. 🔄 FCM conversion process (arrays → JSON strings)");
        $this->info("   3. 📤 Final payload sent to FCM/Expo");
        $this->info("   4. ✅ Success confirmation or error details");
    }
}