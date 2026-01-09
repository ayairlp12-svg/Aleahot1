#!/bin/bash

# ============================================================
# SCRIPT: backend/setup-production.sh
# DESCRIPCIÓN: Configuración inicial para producción
# 
# USO: chmod +x setup-production.sh && ./setup-production.sh
# ============================================================

set -e  # Exit on error

echo "🚀 Configuración de Producción para RifaPlus"
echo "============================================================"

# 1. Verificar que .env existe
echo "📋 Verificando archivo .env..."
if [ ! -f ".env" ]; then
    echo "❌ Archivo .env NO encontrado"
    echo "✅ Creando .env desde .env.example..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edita .env y completa los valores (especialmente JWT_SECRET)"
    exit 1
fi

# 2. Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install --production

# 3. Verificar variables de entorno críticas
echo ""
echo "🔐 Verificando variables de entorno..."

missing_vars=0

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET no está configurado"
    missing_vars=1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL no está configurado"
    missing_vars=1
fi

if [ $missing_vars -eq 1 ]; then
    echo ""
    echo "⚠️  IMPORTANTE: Configura todas las variables en .env antes de continuar"
    exit 1
fi

echo "✅ Todas las variables están configuradas"

# 4. Ejecutar migraciones
echo ""
echo "🔧 Ejecutando migraciones de base de datos..."
npx knex migrate:latest

# 5. Verificar conexión a BD
echo ""
echo "🔗 Probando conexión a base de datos..."
node -e "const db = require('./db'); db.raw('SELECT 1').then(() => { console.log('✅ Conexión a BD exitosa'); process.exit(0); }).catch(err => { console.error('❌ Error de conexión:', err.message); process.exit(1); });"

# 6. Crear admin user si no existe
echo ""
echo "👤 Verificando usuario admin..."
node -e "
const db = require('./db');
db('admin_users').first().then(user => {
    if (user) {
        console.log('✅ Ya existe usuario admin');
        process.exit(0);
    } else {
        console.log('⚠️  No hay usuarios admin. Ejecuta: node create-admin.js');
        process.exit(0);
    }
});
"

# 7. Verificar que config.json existe
echo ""
echo "⚙️  Verificando configuración..."
if [ ! -f "config.json" ]; then
    echo "❌ config.json NO encontrado"
    exit 1
fi
echo "✅ config.json encontrado"

# 8. Resumen final
echo ""
echo "============================================================"
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "============================================================"
echo ""
echo "Próximos pasos:"
echo "1. Crear usuario admin: node create-admin.js"
echo "2. Iniciar servidor: npm start"
echo "3. Verificar: curl http://localhost:5001/api/health"
echo ""
echo "Para producción en Render:"
echo "1. Conecta tu repositorio GitHub"
echo "2. Configura variables de entorno en Render Dashboard"
echo "3. Render ejecutará npm install && npm start automáticamente"
echo ""
