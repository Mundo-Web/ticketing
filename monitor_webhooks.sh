#!/bin/bash

# Script para monitorear webhooks de NinjaOne en tiempo real
echo "🔍 Monitoreando webhooks de NinjaOne..."
echo "📍 URL del webhook: https://adkassist.xyz/api/ninjaone/webhook"
echo "🔧 Para configurar en NinjaOne:"
echo "   - URL: https://adkassist.xyz/api/ninjaone/webhook"
echo "   - Secret: e256e0691a9c365560b9c76817d82bf8954a86fa33467ad63df4edc781dec9b9"
echo ""
echo "📊 Logs en tiempo real:"
echo "----------------------------------------"

# Monitorear el log de Laravel filtrando por NinjaOne
tail -f storage/logs/laravel.log | grep -i "ninjaone\|webhook"
