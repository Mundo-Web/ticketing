<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PushToken;
use Illuminate\Support\Facades\Log;

class FixPushTokenTypes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'push:fix-token-types';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix incorrectly classified push token types (FCM vs Expo)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔧 Corrigiendo tipos de tokens push...');
        $this->info('=====================================');
        $this->newLine();

        // Get all push tokens
        $tokens = PushToken::all();
        $corrected = 0;
        $alreadyCorrect = 0;

        $this->info("📊 Revisando {$tokens->count()} tokens...");
        $this->newLine();

        $bar = $this->output->createProgressBar($tokens->count());
        $bar->start();

        foreach ($tokens as $token) {
            $detectedType = $this->detectTokenType($token->push_token);
            $currentType = $token->token_type;
            
            if ($detectedType !== $currentType) {
                $this->newLine();
                $this->warn("🔄 Corrigiendo token ID {$token->id}:");
                $this->line("   Token: " . substr($token->push_token, 0, 30) . "...");
                $this->line("   Tipo actual: {$currentType}");
                $this->line("   Tipo correcto: {$detectedType}");
                
                $token->update(['token_type' => $detectedType]);
                $corrected++;
                
                Log::info("Token type corrected", [
                    'token_id' => $token->id,
                    'tenant_id' => $token->tenant_id,
                    'old_type' => $currentType,
                    'new_type' => $detectedType,
                    'token_preview' => substr($token->push_token, 0, 20) . '...'
                ]);
                
                $this->info("   ✅ Corregido");
                $this->newLine();
            } else {
                $alreadyCorrect++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info('📈 RESUMEN:');
        $this->info('===========');
        $this->info("✅ Tokens ya correctos: {$alreadyCorrect}");
        $this->info("🔄 Tokens corregidos: {$corrected}");
        $this->info("📊 Total procesados: {$tokens->count()}");
        $this->newLine();

        if ($corrected > 0) {
            $this->success('🎉 ¡Corrección completada! Las notificaciones push ahora deberían funcionar correctamente.');
        } else {
            $this->info('👍 Todos los tokens ya tenían el tipo correcto.');
        }

        $this->newLine();
        $this->info('🔄 Para aplicar los cambios, las próximas notificaciones usarán los tipos corregidos automáticamente.');
        
        return Command::SUCCESS;
    }

    /**
     * Detect token type based on token format
     */
    private function detectTokenType($token)
    {
        // Expo tokens start with "ExponentPushToken["
        if (strpos($token, 'ExponentPushToken[') === 0) {
            return 'expo';
        }
        
        // FCM tokens are typically longer and don't have the Expo prefix
        if (strlen($token) > 100 && strpos($token, 'ExponentPushToken') === false) {
            return 'fcm';
        }
        
        // Default to expo for safety
        return 'expo';
    }
}
