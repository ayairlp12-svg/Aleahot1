/**
 * Script: Limpiar BD pero mantener tablas y usuario admin
 * Objetivo: Resetear todos los datos pero conservar estructura
 */

// Cargar variables de entorno desde .env
require('dotenv').config();

const db = require('../db');

async function cleanAndReset() {
    console.log('🧹 Iniciando limpieza de BD...\n');

    try {
        // PASO 1: Limpiar datos (pero NO DROP tables)
        console.log('1️⃣  Limpiando tabla ordenes...');
        const deletedOrdenes = await db('ordenes').del();
        console.log(`   ✅ Eliminadas ${deletedOrdenes} órdenes`);

        console.log('2️⃣  Limpiando tabla boletos_estado...');
        const deletedBoletos = await db('boletos_estado').del();
        console.log(`   ✅ Eliminados ${deletedBoletos} registros de boletos`);

        console.log('3️⃣  Limpiando tabla ganadores...');
        const deletedGanadores = await db('ganadores').del();
        console.log(`   ✅ Eliminados ${deletedGanadores} ganadores`);

        console.log('4️⃣  Limpiando tabla ordenes_expiradas_log...');
        const deletedExpLog = await db('ordenes_expiradas_log').del();
        console.log(`   ✅ Eliminados ${deletedExpLog} logs de expiración`);

        // PASO 2: Resetear secuencia de órdenes (si existe)
        try {
            console.log('5️⃣  Reseteando secuencia de ID de órdenes...');
            await db.raw('ALTER SEQUENCE ordenes_id_seq RESTART WITH 1');
            console.log('   ✅ Secuencia reseteada');
        } catch (e) {
            console.log('   ⚠️  No hay secuencia (ignorado)');
        }

        // PASO 3: Recrear 60,000 boletos como "disponibles"
        console.log('6️⃣  Creando 60,000 boletos disponibles (esto toma unos segundos)...');
        
        const CHUNK_SIZE = 5000;
        const totalBoletos = 60000;
        let created = 0;

        for (let i = 1; i <= totalBoletos; i += CHUNK_SIZE) {
            const chunk = [];
            const end = Math.min(i + CHUNK_SIZE - 1, totalBoletos);
            
            for (let num = i; num <= end; num++) {
                chunk.push({
                    numero: num,
                    estado: 'disponible',
                    numero_orden: null,
                    reservado_en: null,
                    vendido_en: null,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }

            await db('boletos_estado').insert(chunk);
            created += chunk.length;
            console.log(`   ✅ Creados ${created}/${totalBoletos} boletos`);
        }

        // PASO 4: Verificar usuario admin (no lo elimines, mantenerlo)
        console.log('\n7️⃣  Verificando usuario admin...');
        const adminUser = await db('admin_users').first();
        if (adminUser) {
            console.log(`   ✅ Usuario admin existente: ${adminUser.usuario}`);
        } else {
            console.log('   ⚠️  No hay usuario admin, creando uno...');
            await db('admin_users').insert({
                usuario: 'admin',
                contraseña: 'admin123', // CAMBIAR EN PRODUCTION
                nombre: 'Administrador',
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log('   ✅ Usuario admin creado (usuario: admin, contraseña: admin123)');
        }

        // PASO 5: Resetear sorteo_configuracion
        console.log('\n8️⃣  Reseteando configuración de sorteo...');
        await db('sorteo_configuracion').del();
        await db('sorteo_configuracion').insert({
            id: 1,
            nombre_sorteo: 'Rifa Plus',
            estado: 'activo',
            created_at: new Date(),
            updated_at: new Date()
        });
        console.log('   ✅ Configuración reseteada');

        // RESUMEN FINAL
        console.log('\n' + '='.repeat(60));
        console.log('✅ LIMPIEZA COMPLETADA');
        console.log('='.repeat(60));
        console.log('\nEstado actual:');
        console.log('  📊 Boletos: 60,000 (todos disponibles)');
        console.log('  📋 Órdenes: 0');
        console.log('  🏆 Ganadores: 0');
        console.log('  👤 Usuario admin: CONSERVADO');
        console.log('  ⚙️  Configuración: RESETEADA');
        console.log('\nPuedes iniciar de nuevo con la BD limpia.');
        console.log('='.repeat(60));

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error durante la limpieza:', error.message);
        console.error(error);
        process.exit(1);
    }
}

cleanAndReset();
