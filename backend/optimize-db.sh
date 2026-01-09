#!/bin/bash

# Script para optimizar la base de datos

echo "🚀 Iniciando optimización de base de datos..."

# Ejecutar migraciones pendientes
echo "📊 Ejecutando migraciones..."
cd "$(dirname "$0")" || exit
npm run migrate

# Ejecutar el servidor
echo "✅ Optimización completada. Iniciando servidor..."
npm start
