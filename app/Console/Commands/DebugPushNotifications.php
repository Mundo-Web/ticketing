<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PushToken;
use Illuminate\Support\Facades\Log;

class DebugPushNotifications extends Command
{
    protected $signature = 'push:debug';
    protected $description = 'Debug push notifications system';

    public function handle()
    {
        $this->info('🔍 DIAGNÓSTICO: Push Notifications Debug');
        $this->info('=====================================');
        $this->newLine();

        // 1. Ver tokens registrados
        $this->info('📊 TOKENS REGISTRADOS:');
        $this->info('=====================');

        $tokens = PushToken::with('tenant')->get();

        if ($tokens->isEmpty()) {
            $this->error('❌ NO HAY TOKENS REGISTRADOS');
            $this->line('   - La app móvil no está registrando tokens');
            $this->line('   - Verificar que la app esté llamando a register-push-token');
            $this->newLine();
        } else {
            foreach ($tokens as $token) {
                $this->info("🎯 Token ID: {$token->id}");
                $this->line("   Tenant: {$token->tenant_id}");
                $this->line("   Tipo: {$token->token_type}");
                $this->line("   Platform: {$token->platform}");
                $this->line("   Device: {$token->device_name}");
                $this->line("   Standalone: " . ($token->is_standalone ? 'YES' : 'NO'));
                $this->line("   Token: " . substr($token->push_token, 0, 50) . "...");
                $this->line("   Creado: {$token->created_at}");
                $this->line("   Activo: " . ($token->is_active ? 'YES' : 'NO'));
                $this->newLine();
            }
        }

        // 2. Verificar Firebase
        $this->info('🔥 CONFIGURACIÓN FIREBASE:');
        $this->info('=========================');

        $firebaseCredentials = config('services.firebase.credentials');
        $firebaseProjectId = config('services.firebase.project_id');

        $this->line("Credentials: " . ($firebaseCredentials ?: 'NOT SET'));
        $this->line("Project ID: " . ($firebaseProjectId ?: 'NOT SET'));

        if ($firebaseCredentials) {
            if (file_exists($firebaseCredentials)) {
                $this->line("Archivo existe: ✅ YES");
            } else {
                $this->error("Archivo existe: ❌ NO - " . $firebaseCredentials);
            }
        }

        if (class_exists('Kreait\Firebase\Factory')) {
            $this->line("Firebase SDK: ✅ INSTALLED");
        } else {
            $this->error("Firebase SDK: ❌ NOT FOUND");
        }

        $this->newLine();

        // 3. Estadísticas por tipo
        if (!$tokens->isEmpty()) {
            $this->info('📈 ESTADÍSTICAS:');
            $this->info('===============');

            $expoCount = $tokens->where('token_type', 'expo')->count();
            $fcmCount = $tokens->where('token_type', 'fcm')->count();
            $androidCount = $tokens->where('platform', 'android')->count();
            $iosCount = $tokens->where('platform', 'ios')->count();

            $this->line("📱 Tokens Expo: {$expoCount}");
            $this->line("🔥 Tokens FCM: {$fcmCount}");
            $this->line("🤖 Android: {$androidCount}");
            $this->line("🍎 iOS: {$iosCount}");
            $this->newLine();

            if ($fcmCount === 0) {
                $this->warn('⚠️  NO HAY TOKENS FCM REGISTRADOS');
                $this->line('   Esto significa que el APK no está enviando tokens FCM');
                $this->line('   Problema probablemente en la configuración móvil');
            }
        }

        // 4. Recomendaciones
        $this->info('💡 PRÓXIMOS PASOS:');
        $this->info('==================');

        if ($tokens->isEmpty()) {
            $this->line('1. 📱 Verificar que la app móvil registre tokens al iniciar');
            $this->line('2. 🔗 Probar endpoint register-push-token manualmente');
            $this->line('3. 📋 Revisar logs de la app móvil');
        } else {
            $hasFcm = $tokens->where('token_type', 'fcm')->count() > 0;
            
            if (!$hasFcm) {
                $this->line('1. 🤖 APK no está enviando tokens FCM');
                $this->line('   - Verificar configuración Firebase en mobile');
                $this->line('   - Comprobar google-services.json');
                $this->line('   - Revisar permisos de notificaciones');
            }
            
            if (!file_exists($firebaseCredentials ?? '')) {
                $this->line('2. 🔥 Descargar credenciales Firebase');
                $this->line("   - Colocar en: {$firebaseCredentials}");
            }
        }

        return Command::SUCCESS;
    }
}
