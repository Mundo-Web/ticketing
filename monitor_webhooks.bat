@echo off
echo 🔍 Monitoreando webhooks de NinjaOne en tiempo real...
echo 📅 Fecha: %date% %time%
echo 🌐 Webhook URL: https://adkassist.xyz/api/ninjaone/webhook
echo.
echo Presiona Ctrl+C para salir
echo ===============================================

cd c:\xampp\htdocs\projects\ticketing
powershell -Command "Get-Content storage/logs/laravel.log -Wait -Tail 0 | Select-String 'webhook|ninjaone|alert' -CaseSensitive:$false"
