<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PushToken;
use App\Models\Tenant;

class MonitorPushNotifications extends Command
{
    protected $signature = 'push:monitor {tenant_id?}';
    protected $description = 'Monitor push notifications in real time';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        
        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                $this->error("❌ Tenant not found: {$tenantId}");
                return;
            }
            $this->monitorTenant($tenant);
        } else {
            $this->monitorAll();
        }
    }

    private function monitorTenant($tenant)
    {
        $this->info("🔍 MONITORING TENANT: {$tenant->id} - {$tenant->name}");
        $this->info("===============================================");
        
        $this->showTenantTokens($tenant);
        $this->showRecentActivity($tenant);
    }

    private function monitorAll()
    {
        $this->info("🔍 MONITORING ALL PUSH NOTIFICATIONS");
        $this->info("===================================");
        
        // Show total statistics
        $totalTokens = PushToken::count();
        $expoTokens = PushToken::where('token_type', 'expo')->count();
        $fcmTokens = PushToken::where('token_type', 'fcm')->count();
        $activeTokens = PushToken::where('is_active', true)->count();
        
        $this->info("📊 GLOBAL STATISTICS:");
        $this->line("   Total tokens: {$totalTokens}");
        $this->line("   Active tokens: {$activeTokens}");
        $this->line("   Expo tokens: {$expoTokens}");
        $this->line("   FCM tokens: {$fcmTokens}");
        
        if ($fcmTokens === 0) {
            $this->warn("⚠️  NO FCM TOKENS REGISTERED");
            $this->line("   This means APK apps are not registering FCM tokens");
        }
        
        $this->newLine();
        
        // Show tokens by tenant
        $tenants = Tenant::has('pushTokens')->with('pushTokens')->get();
        
        if ($tenants->isEmpty()) {
            $this->error("❌ NO TENANTS WITH PUSH TOKENS");
            $this->line("   No users have registered push tokens yet");
            return;
        }
        
        foreach ($tenants as $tenant) {
            $this->showTenantTokens($tenant);
        }
    }

    private function showTenantTokens($tenant)
    {
        $tokens = $tenant->pushTokens;
        
        $this->info("👤 TENANT: {$tenant->id} - {$tenant->name}");
        
        if ($tokens->isEmpty()) {
            $this->warn("   ❌ No tokens registered");
            $this->newLine();
            return;
        }
        
        foreach ($tokens as $token) {
            $status = $token->is_active ? '✅ Active' : '❌ Inactive';
            $standalone = $token->is_standalone ? 'Standalone APK' : 'Expo Go';
            
            $this->line("   📱 {$token->device_name} ({$token->platform})");
            $this->line("      Type: {$token->token_type} | {$standalone}");
            $this->line("      Status: {$status}");
            $this->line("      Token: " . substr($token->push_token, 0, 40) . "...");
            $this->line("      Last updated: {$token->updated_at}");
            $this->newLine();
        }
    }

    private function showRecentActivity($tenant)
    {
        $this->info("📋 RECENT PUSH ACTIVITY:");
        
        $logFile = storage_path('logs/laravel.log');
        if (!file_exists($logFile)) {
            $this->warn("   No log file found");
            return;
        }
        
        $content = file_get_contents($logFile);
        $lines = explode("\n", $content);
        
        // Filter push notification related logs for this tenant
        $pushLogs = array_filter($lines, function($line) use ($tenant) {
            return (strpos($line, 'PUSH') !== false || 
                   strpos($line, 'Push') !== false || 
                   strpos($line, 'FCM') !== false ||
                   strpos($line, 'Expo') !== false) &&
                   strpos($line, "tenant_id\":{$tenant->id}") !== false;
        });
        
        if (empty($pushLogs)) {
            $this->warn("   ❌ No recent push notification activity for this tenant");
            $this->line("   This could mean:");
            $this->line("   - No notifications have been triggered");
            $this->line("   - Notifications are failing before logging");
            $this->line("   - Tenant ID mismatch in logs");
        } else {
            $recentLogs = array_slice($pushLogs, -10);
            foreach ($recentLogs as $log) {
                $this->line("   📄 " . trim($log));
            }
        }
        
        $this->newLine();
    }
}
