#!/bin/bash

echo "🔍 Monitoreando webhooks de NinjaOne en tiempo real..."
echo "📅 Fecha: $(date)"
echo "🌐 Webhook URL: https://adkassist.xyz/api/ninjaone/webhook"
echo ""
echo "Filtrando por: webhook, ninjaone, alert"
echo "==============================================="

# Monitorear logs de Laravel
tail -f storage/logs/laravel.log | grep -i "webhook\|ninjaone\|alert"
