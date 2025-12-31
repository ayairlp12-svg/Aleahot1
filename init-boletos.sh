#!/bin/bash

# ============================================================
# Script: Inicializar arquitectura de 1M boletos
# Uso: ./init-boletos.sh [total_boletos]
# Ejemplo: ./init-boletos.sh 1000000
# ============================================================

set -e

cd "$(dirname "$0")/backend"

TOTAL_BOLETOS=${1:-1000000}
ADMIN_TOKEN=${ADMIN_TOKEN:-""}

echo "🚀 Inicializando arquitectura para $TOTAL_BOLETOS boletos..."
echo ""

# 1. Ejecutar migraciones
echo "📝 Ejecutando migraciones..."
npm run migrate

if [ $? -ne 0 ]; then
    echo "❌ Error en migraciones"
    exit 1
fi

echo "✅ Migraciones completadas"
echo ""

# 2. Inicializar boletos
echo "🔄 Inicializando boletos en BD (esto tarda ~5 minutos)..."
echo ""

# Si tenemos token, usar API
if [ -n "$ADMIN_TOKEN" ]; then
    echo "  Usando API endpoint..."
    curl -X POST http://localhost:5001/api/boletos/inicializar \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "{\"totalBoletos\": $TOTAL_BOLETOS}"
    echo ""
else
    # Sino, usar Knex directamente
    echo "  Usando Knex (asegúrate que el servidor está corriendo)..."
    node -e "
const BoletoService = require('./services/boletoService');
BoletoService.inicializarBoletos($TOTAL_BOLETOS)
    .then(() => {
        console.log('✅ Boletos inicializados');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
"
fi

echo ""
echo "✅ ¡Arquitectura de 1M boletos lista!"
echo ""
echo "Próximos pasos:"
echo "  1. Incluir js/boletos-loader.js en HTML"
echo "  2. Verificar que la BD tiene los boletos:"
echo "     SELECT COUNT(*) FROM boletos_estado;"
echo "  3. Hacer test de compra:"
echo "     POST /api/ordenes con boletos [1,2,3,4,5]"
echo ""
