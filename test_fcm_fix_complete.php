<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Database\Capsule\Manager as Capsule;
use App\Models\User;
use App\Models\Ticket;
use App\Models\PushToken;
use App\Events\NotificationCreated;
use App\Services\NotificationDispatcherService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;

// Create Laravel app context
$app = new Application;
$app->instance('path.config', __DIR__ . '/config');

// Load configuration
if (file_exists(__DIR__ . '/bootstrap/app.php')) {
    $app = require_once __DIR__ . '/bootstrap/app.php';
} else {
    echo "❌ Could not load Laravel app - testing direct notification send...\n";
    
    // Direct test of notification services
    echo "\n🔍 TESTING FCM ARRAY CONVERSION FIX\n";
    echo "====================================\n";
    
    // Simulate complex nested data that was causing FCM errors
    $complexData = [
        'ticket_id' => 123,
        'device' => [
            'id' => 456,
            'name' => 'JULIOPC',
            'brand' => [
                'name' => 'Dell',
                'model' => 'Inspiron'
            ]
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
                'building' => [
                    'name' => 'Main Building'
                ]
            ]
        ],
        'metadata' => [
            'assigned_at' => '2024-01-15 10:30:00',
            'priority' => 'high',
            'tags' => ['urgent', 'hardware', 'desktop']
        ]
    ];
    
    echo "📦 Original Data Structure:\n";
    print_r($complexData);
    
    // Test the convertDataForFCM function
    echo "\n🔄 Converting for FCM...\n";
    
    function convertDataForFCM($data) {
        $converted = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $converted[$key] = json_encode($value);
            } else {
                $converted[$key] = (string) $value;
            }
        }
        return $converted;
    }
    
    $fcmData = convertDataForFCM($complexData);
    
    echo "📤 FCM-Compatible Data:\n";
    print_r($fcmData);
    
    echo "\n✅ Conversion Test Complete!\n";
    echo "- All nested arrays converted to JSON strings\n";
    echo "- All values are now string type for FCM compatibility\n";
    
    // Test payload structure
    echo "\n📱 Testing Notification Payload Structure:\n";
    
    $title = "Ticket Assignment";
    $body = "New ticket assigned for device JULIOPC in Main Building apt A-101";
    
    $expoPayload = [
        'to' => 'ExponentPushToken[example_token]',
        'title' => $title,
        'body' => $body,
        'data' => $complexData, // Expo can handle arrays
        'sound' => 'default',
        'priority' => 'high',
    ];
    
    $fcmPayload = [
        'token' => 'fcm_token_example',
        'notification' => [
            'title' => $title,
            'body' => $body,
        ],
        'data' => $fcmData, // FCM needs strings only
        'android' => [
            'priority' => 'high',
            'notification' => [
                'sound' => 'default',
                'channel_id' => 'default',
            ],
        ],
    ];
    
    echo "\n📱 EXPO Payload (arrays OK):\n";
    echo "Title: " . $expoPayload['title'] . "\n";
    echo "Body: " . $expoPayload['body'] . "\n";
    echo "Data types in payload:\n";
    foreach ($expoPayload['data'] as $key => $value) {
        echo "  - $key: " . gettype($value) . "\n";
    }
    
    echo "\n🔥 FCM Payload (strings only):\n";
    echo "Title: " . $fcmPayload['notification']['title'] . "\n";
    echo "Body: " . $fcmPayload['notification']['body'] . "\n";
    echo "Data types in payload:\n";
    foreach ($fcmPayload['data'] as $key => $value) {
        echo "  - $key: " . gettype($value) . " (length: " . strlen($value) . ")\n";
    }
    
    echo "\n🎯 FCM ERROR ANALYSIS:\n";
    echo "Before fix: FCM would receive nested arrays and throw 'Array to string conversion'\n";
    echo "After fix: All complex data converted to JSON strings before sending to FCM\n";
    echo "Result: FCM should now accept the notification data without errors\n";
    
    exit;
}

try {
    echo "\n🧪 COMPLETE FCM FIX TEST\n";
    echo "========================\n";
    
    // Find a test user with push tokens
    $user = User::with('pushTokens')->whereHas('pushTokens')->first();
    
    if (!$user) {
        echo "❌ No users with push tokens found. Creating test scenario...\n";
        
        // Create test notification data
        $testData = [
            'type' => 'ticket_assigned',
            'title' => 'Test FCM Fix',
            'message' => 'Testing array conversion fix for FCM notifications',
            'data' => [
                'ticket_id' => 999,
                'device' => [
                    'name' => 'TEST-DEVICE',
                    'brand' => ['name' => 'Test Brand']
                ],
                'technical' => [
                    'name' => 'Test Tech',
                    'phone' => '+1234567890'
                ]
            ]
        ];
        
        echo "📤 Test Data Created:\n";
        print_r($testData);
        
    } else {
        echo "✅ Found user with push tokens: " . $user->name . "\n";
        echo "📱 Push tokens count: " . $user->pushTokens->count() . "\n";
        
        foreach ($user->pushTokens as $token) {
            $tokenType = (strpos($token->token, 'ExponentPushToken') !== false) ? 'EXPO' : 'FCM';
            echo "  - Token type: $tokenType\n";
            echo "    Token: " . substr($token->token, 0, 30) . "...\n";
        }
        
        // Find a ticket to create real notification
        $ticket = Ticket::with(['device.brand', 'technical', 'tenant.apartment.building'])
                         ->first();
        
        if ($ticket && $ticket->technical) {
            echo "\n🎫 Creating real notification for ticket: " . $ticket->id . "\n";
            echo "📋 Ticket details:\n";
            echo "  - Device: " . ($ticket->device->name ?? 'N/A') . "\n";
            echo "  - Technical: " . ($ticket->technical->name ?? 'N/A') . "\n";
            echo "  - Tenant: " . ($ticket->tenant->name ?? 'N/A') . "\n";
            
            $dispatcherService = new NotificationDispatcherService();
            
            // This will trigger the enhanced logging system
            $dispatcherService->dispatchTicketAssigned($ticket, $ticket->technical, $user);
            
            echo "✅ Notification dispatched! Check logs for complete flow.\n";
            
        } else {
            echo "❌ No tickets with technical assignment found for real test\n";
            
            // Create a direct notification event to test the system
            echo "\n📢 Creating direct NotificationCreated event...\n";
            
            $testNotificationData = [
                'type' => 'ticket_assigned',
                'title' => 'FCM Fix Test',
                'message' => 'Testing FCM array conversion with complex nested data',
                'data' => [
                    'ticket_id' => 999,
                    'device' => [
                        'id' => 123,
                        'name' => 'TEST-DEVICE',
                        'brand' => [
                            'name' => 'Test Brand',
                            'model' => 'Test Model'
                        ]
                    ],
                    'technical' => [
                        'id' => 456,
                        'name' => 'Test Technical',
                        'phone' => '+1234567890'
                    ],
                    'tenant' => [
                        'name' => 'Test Tenant',
                        'apartment' => [
                            'number' => 'A-101',
                            'building' => [
                                'name' => 'Test Building'
                            ]
                        ]
                    ]
                ]
            ];
            
            // Dispatch the event directly
            Event::dispatch(new NotificationCreated(
                $user,
                $testNotificationData['type'],
                $testNotificationData['title'],
                $testNotificationData['message'],
                $testNotificationData['data']
            ));
            
            echo "✅ Direct notification event dispatched!\n";
        }
    }
    
    echo "\n📊 EXPECTED LOG FLOW:\n";
    echo "1. 🚀 NotificationDispatcherService: Creating notification with real model data\n";
    echo "2. 📢 Event dispatched: NotificationCreated\n";
    echo "3. 👂 SendPushNotificationListener: 8-stage logging process\n";
    echo "4. 🔍 Data processing and message enhancement\n";
    echo "5. 📱 Token detection (Expo vs FCM)\n";
    echo "6. 🔄 FCM array conversion (if FCM token)\n";
    echo "7. 📤 API call to push service\n";
    echo "8. ✅ Success confirmation or error details\n";
    
    echo "\n🔍 CHECK YOUR LOGS:\n";
    echo "php artisan log:tail --lines=50\n";
    echo "or check: storage/logs/laravel.log\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n✅ FCM Fix Test Complete!\n";