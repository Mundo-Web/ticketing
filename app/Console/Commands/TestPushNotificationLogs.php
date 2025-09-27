<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ticket;
use App\Models\Technical;
use App\Models\User;
use App\Services\NotificationDispatcherService;
use Illuminate\Support\Facades\Log;

class TestPushNotificationLogs extends Command
{
    protected $signature = 'push:test-logs {--type=status_change : Type of notification to test}';
    protected $description = 'Test push notifications with detailed logging';

    public function handle()
    {
        $this->info('🧪 Testing Push Notifications with Detailed Logging');
        $this->info('========================================================');

        $type = $this->option('type');

        switch ($type) {
            case 'status_change':
                $this->testStatusChange();
                break;
            case 'assignment':
                $this->testAssignment();
                break;
            case 'created':
                $this->testTicketCreated();
                break;
            default:
                $this->testStatusChange();
                break;
        }

        $this->info('✅ Test completed. Check the logs for detailed information:');
        $this->info('📝 Laravel Log: storage/logs/laravel.log');
        $this->info('🔍 Search for: PUSH NOTIFICATION or NOTIFICATION DISPATCHER');
    }

    private function testStatusChange()
    {
        $this->info('🔄 Testing Ticket Status Change Notification...');

        // Find a test ticket
        $ticket = Ticket::with(['user.tenant.apartment.building', 'device.name_device', 'device.brand', 'device.model', 'technical'])
            ->whereHas('user.tenant')
            ->first();

        if (!$ticket) {
            $this->error('❌ No ticket found with tenant relationship');
            return;
        }

        $this->info("📋 Using Ticket: {$ticket->code} - {$ticket->title}");
        $this->info("👤 User: {$ticket->user->name} (ID: {$ticket->user->id})");
        $tenantName = $ticket->user->tenant->name ?? 'N/A';
        $this->info("🏠 Tenant: {$tenantName}");

        // Simulate status change
        $oldStatus = $ticket->status;
        $newStatus = $oldStatus === 'open' ? 'in_progress' : 'open';

        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'super-admin');
        })->first();

        if (!$admin) {
            $this->error('❌ No admin user found');
            return;
        }

        $this->info("🔄 Changing status from '{$oldStatus}' to '{$newStatus}'");
        $this->info('📊 Check logs for detailed notification flow...');

        // Clear previous logs for this test
        Log::info('🚀 PUSH NOTIFICATION TEST - Status Change Started', [
            'test_type' => 'status_change',
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'user_id' => $ticket->user->id,
            'admin_id' => $admin->id
        ]);

        $dispatcher = new NotificationDispatcherService();
        $dispatcher->dispatchTicketStatusChanged($ticket, $oldStatus, $newStatus, $admin);

        $this->info('✅ Status change notification dispatched');
    }

    private function testAssignment()
    {
        $this->info('👨‍🔧 Testing Ticket Assignment Notification...');

        $ticket = Ticket::with(['user.tenant.apartment.building', 'device.name_device', 'device.brand', 'device.model'])
            ->whereHas('user.tenant')
            ->whereNull('technical_id')
            ->first();

        $technical = Technical::first();
        $admin = User::whereHas('roles', function ($query) {
            $query->where('name', 'super-admin');
        })->first();

        if (!$ticket || !$technical || !$admin) {
            $this->error('❌ Missing required data for test');
            return;
        }

        $this->info("📋 Using Ticket: {$ticket->code}");
        $this->info("👨‍🔧 Assigning to Technical: {$technical->name}");

        Log::info('🚀 PUSH NOTIFICATION TEST - Assignment Started', [
            'test_type' => 'assignment',
            'ticket_id' => $ticket->id,
            'technical_id' => $technical->id,
            'admin_id' => $admin->id
        ]);

        $dispatcher = new NotificationDispatcherService();
        $dispatcher->dispatchTicketAssigned($ticket, $technical, $admin);

        $this->info('✅ Assignment notification dispatched');
    }

    private function testTicketCreated()
    {
        $this->info('🎫 Testing Ticket Created Notification...');

        $ticket = Ticket::with(['user.tenant.apartment.building', 'device.name_device', 'device.brand', 'device.model'])
            ->whereHas('user.tenant')
            ->latest()
            ->first();

        if (!$ticket) {
            $this->error('❌ No ticket found');
            return;
        }

        $this->info("📋 Using Ticket: {$ticket->code} - {$ticket->title}");

        Log::info('🚀 PUSH NOTIFICATION TEST - Ticket Created Started', [
            'test_type' => 'ticket_created',
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code
        ]);

        $dispatcher = new NotificationDispatcherService();
        $dispatcher->dispatchTicketCreated($ticket);

        $this->info('✅ Ticket created notification dispatched');
    }
}