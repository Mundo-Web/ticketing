<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckDuplicatePushNotifications extends Command
{
    protected $signature = 'push:check-duplicates';
    protected $description = 'Check for duplicate push notification systems';

    public function handle()
    {
        $this->info('🔍 CHECKING FOR DUPLICATE PUSH NOTIFICATIONS');
        $this->info('===========================================');
        $this->newLine();

        // Check if both systems are active
        $this->info('📋 SISTEMAS DE NOTIFICACIÓN ACTIVOS:');
        $this->info('===================================');

        // 1. Check Listener System
        $listenerExists = class_exists('App\Listeners\SendPushNotificationListener');
        $this->line('1. 🎧 Listener System (Automático):');
        if ($listenerExists) {
            $this->line('   ✅ SendPushNotificationListener existe');
            
            // Check if it's registered
            $providerPath = app_path('Providers/AppServiceProvider.php');
            if (file_exists($providerPath)) {
                $content = file_get_contents($providerPath);
                if (strpos($content, 'SendPushNotificationListener') !== false) {
                    $this->line('   ✅ Registrado en AppServiceProvider');
                    $this->warn('   ⚠️  SISTEMA AUTOMÁTICO ACTIVO');
                } else {
                    $this->line('   ❌ No registrado en AppServiceProvider');
                }
            }
        } else {
            $this->line('   ❌ SendPushNotificationListener no existe');
        }
        $this->newLine();

        // 2. Check Direct System
        $this->line('2. 🎯 Direct System (Manual):');
        $controllerPath = app_path('Http/Controllers/Api/TenantController.php');
        if (file_exists($controllerPath)) {
            $content = file_get_contents($controllerPath);
            
            $directCalls = 0;
            if (strpos($content, '$this->pushService->sendPushToTenant') !== false) {
                $directCalls++;
                $this->line('   ✅ Llamadas directas en TenantController');
            }
            
            if (strpos($content, 'sendPushToTenant') !== false) {
                $matches = preg_match_all('/sendPushToTenant/', $content);
                $this->line("   📊 Encontradas {$matches} llamadas directas");
                if ($matches > 0) {
                    $this->warn('   ⚠️  SISTEMA DIRECTO ACTIVO');
                }
            }
        }
        $this->newLine();

        // 3. Check recent logs for duplicates
        $this->info('📄 ANÁLISIS DE LOGS RECIENTES:');
        $this->info('=============================');
        
        $logFile = storage_path('logs/laravel.log');
        if (file_exists($logFile)) {
            $content = file_get_contents($logFile);
            $lines = explode("\n", $content);
            
            // Get recent push notification logs
            $pushLogs = array_filter($lines, function($line) {
                return strpos($line, '🔔 PUSH NOTIFICATION REQUEST') !== false ||
                       strpos($line, 'Push notification sent from listener') !== false ||
                       strpos($line, 'Sending push notification for') !== false;
            });
            
            $recentLogs = array_slice($pushLogs, -20);
            
            if (empty($recentLogs)) {
                $this->line('   ❌ No hay logs recientes de push notifications');
            } else {
                $this->line('   📋 Últimos logs de push notifications:');
                foreach ($recentLogs as $log) {
                    if (strpos($log, 'listener') !== false) {
                        $this->line('   🎧 ' . trim($log));
                    } elseif (strpos($log, 'Sending push notification for') !== false) {
                        $this->line('   🎯 ' . trim($log));
                    } else {
                        $this->line('   📤 ' . trim($log));
                    }
                }
            }
        } else {
            $this->line('   ❌ Archivo de log no encontrado');
        }
        $this->newLine();

        // 4. Recommendations
        $this->info('💡 RECOMENDACIONES:');
        $this->info('==================');
        
        if ($listenerExists && $directCalls > 0) {
            $this->warn('⚠️  PROBLEMA DETECTADO: AMBOS SISTEMAS ACTIVOS');
            $this->line('');
            $this->line('🔧 SOLUCIONES:');
            $this->line('');
            $this->line('OPCIÓN 1 - MANTENER SOLO AUTOMÁTICO:');
            $this->line('  • Remover llamadas directas del TenantController');
            $this->line('  • Mantener solo el Listener automático');
            $this->line('  • Pro: Más limpio, automático para TODOS los eventos');
            $this->line('  • Contra: Depende de que el listener funcione');
            $this->line('');
            $this->line('OPCIÓN 2 - MANTENER SOLO DIRECTO:');
            $this->line('  • Desactivar el Listener en AppServiceProvider');
            $this->line('  • Mantener solo las llamadas directas');
            $this->line('  • Pro: Control total, más confiable');
            $this->line('  • Contra: Hay que agregar a cada método manualmente');
            $this->line('');
            $this->line('OPCIÓN 3 - HÍBRIDO CON PROTECCIÓN:');
            $this->line('  • Mantener ambos pero evitar duplicados');
            $this->line('  • Agregar flag de "already_sent" o cooldown');
            
        } else if ($listenerExists) {
            $this->info('✅ Solo sistema automático activo - CORRECTO');
        } else if ($directCalls > 0) {
            $this->info('✅ Solo sistema directo activo - CORRECTO');
        } else {
            $this->warn('⚠️  NO HAY SISTEMAS DE PUSH NOTIFICATIONS ACTIVOS');
        }

        return Command::SUCCESS;
    }
}
