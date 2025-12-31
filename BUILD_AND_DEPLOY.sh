#!/bin/bash
# SCRIPT RÁPIDO: Compilar y subir a producción

set -e  # Exit on error

echo "🏗️  Compilando assets para producción..."
cd /Users/ayair/Desktop/rifas-web/backend

# 1. Instalar dependencias (si no están instaladas)
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# 2. Compilar
echo "🔨 Compilando JavaScript y CSS..."
npm run build:prod

# 3. Verificar build
if [ -d "public/build" ]; then
    echo "✅ Build completado exitosamente"
    echo ""
    echo "📊 Tamaño de assets generados:"
    du -sh public/build/*
    echo ""
else
    echo "❌ Error: No se generó la carpeta public/build"
    exit 1
fi

# 4. (Opcional) Pre-comprimir con gzip
# Descomenta la siguiente línea si quieres pre-comprimir
# npm run gzip

echo ""
echo "✨ Listo para producción!"
echo ""
echo "Próximos pasos:"
echo "1. Editar backend/.env y cambiar NODE_ENV=production"
echo "2. Generar nuevo JWT_SECRET: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo "3. Commit y push a tu repositorio"
echo "4. Desplegar a Render/Railway/etc"
echo ""
echo "Para iniciar localmente:"
echo "  npm start (puerto 5001)"
echo ""
