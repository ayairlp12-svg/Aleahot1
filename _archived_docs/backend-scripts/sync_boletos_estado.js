#!/usr/bin/env node
/**
 * Script: Sincronizar tabla boletos_estado con realidad de órdenes
 * 
 * OBJETIVO: Garantizar que boletos_estado SIEMPRE refleja el estado correcto
 * 
 * Casos que corrige:
 * 1. Boletos reservados sin orden válida
 * 2. Boletos vendidos sin orden confirmada
 * 3. Órdenes confirmadas sin boletos en 'vendido'
 * 4. Inconsistencias entre tabla ordenes y boletos_estado
 * 
 * EJECUTAR:
 * - Manual: node sync_boletos_estado.js
 * - Cron: Cada hora con: 0 * * * * cd /app && node scripts/sync_boletos_estado.js
 */

const db = require('../db');

async function sincronizar() {
    console.log('\n=== SINCRONIZAR BOLETOS_ESTADO ===\n');

    try {
        // ========== PASO 1: LIMPIAR BOLETOS RESERVADOS HUÉRFANOS ==========
        console.log('1️⃣  Limpiando boletos reservados sin orden válida...');
        
        const boletosReservados = await db('boletos_estado')
            .where('estado', 'apartado')
            .select('numero_orden')
            .distinct('numero_orden');

        let huerfanos = 0;
        for (const row of boletosReservados) {
            if (!row.numero_orden) continue;

            const ordenExiste = await db('ordenes')
                .where('numero_orden', row.numero_orden)
                .whereIn('estado', ['pendiente', 'comprobante_recibido'])
                .first();

            if (!ordenExiste) {
                const liberados = await db('boletos_estado')
                    .where('numero_orden', row.numero_orden)
                    .update({
                        estado: 'disponible',
                        numero_orden: null,
                        reservado_en: null,
                        updated_at: new Date()
                    });
                
                huerfanos += liberados;
                console.log(`   ✓ Orden ${row.numero_orden}: ${liberados} boletos liberados`);
            }
        }
        console.log(`   Total liberados: ${huerfanos}\n`);

        // ========== PASO 2: ASEGURAR ÓRDENES CONFIRMADAS TIENEN BOLETOS 'VENDIDO' ==========
        console.log('2️⃣  Sincronizando órdenes confirmadas...');

        const ordenesConfirmadas = await db('ordenes')
            .where('estado', 'confirmada')
            .select('id', 'numero_orden', 'boletos');

        let actualizadosVendidos = 0;
        for (const orden of ordenesConfirmadas) {
            let boletos = [];
            try {
                boletos = JSON.parse(orden.boletos || '[]');
            } catch (e) {
                continue;
            }

            if (boletos.length === 0) continue;

            const actualizados = await db('boletos_estado')
                .whereIn('numero', boletos)
                .where('estado', '!=', 'vendido')
                .update({
                    estado: 'vendido',
                    numero_orden: orden.numero_orden,
                    vendido_en: new Date(),
                    updated_at: new Date()
                });

            if (actualizados > 0) {
                actualizadosVendidos += actualizados;
                console.log(`   ✓ Orden ${orden.numero_orden}: ${actualizados} boletos marcados como 'vendido'`);
            }
        }
        console.log(`   Total marcados vendidos: ${actualizadosVendidos}\n`);

        // ========== PASO 3: LIMPIAR BOLETOS VENDIDOS SIN ORDEN CONFIRMADA ==========
        console.log('3️⃣  Limpiando boletos vendidos sin orden confirmada...');

        const boletosVendidos = await db('boletos_estado')
            .where('estado', 'vendido')
            .select('numero_orden')
            .distinct('numero_orden');

        let huerfanosVendidos = 0;
        for (const row of boletosVendidos) {
            if (!row.numero_orden) {
                // Boletos vendidos sin orden = inconsistencia CRÍTICA
                const liberados = await db('boletos_estado')
                    .where('numero_orden', null)
                    .where('estado', 'vendido')
                    .update({
                        estado: 'disponible',
                        vendido_en: null,
                        updated_at: new Date()
                    });
                huerfanosVendidos += liberados;
                continue;
            }

            const ordenExiste = await db('ordenes')
                .where('numero_orden', row.numero_orden)
                .where('estado', 'confirmada')
                .first();

            if (!ordenExiste) {
                const liberados = await db('boletos_estado')
                    .where('numero_orden', row.numero_orden)
                    .update({
                        estado: 'disponible',
                        numero_orden: null,
                        vendido_en: null,
                        updated_at: new Date()
                    });
                
                huerfanosVendidos += liberados;
                console.log(`   ✓ Orden ${row.numero_orden}: ${liberados} boletos vendidos sin orden confirmada → liberados`);
            }
        }
        console.log(`   Total liberados: ${huerfanosVendidos}\n`);

        // ========== PASO 4: VERIFICACIÓN FINAL ==========
        console.log('4️⃣  Verificación final...');

        const stats = await db('boletos_estado')
            .select(
                db.raw("estado, COUNT(*) as count")
            )
            .groupBy('estado');

        console.log('   Estado actual de boletos:');
        let total = 0;
        for (const stat of stats) {
            console.log(`     - ${stat.estado}: ${stat.count}`);
            total += stat.count;
        }
        console.log(`     TOTAL: ${total}/60000\n`);

        // Resumen de cambios
        const totalCambios = huerfanos + actualizadosVendidos + huerfanosVendidos;
        console.log(`✅ SINCRONIZACIÓN COMPLETADA`);
        console.log(`   Total cambios: ${totalCambios}`);
        console.log(`   - Boletos liberados (reservados huérfanos): ${huerfanos}`);
        console.log(`   - Boletos marcados vendidos: ${actualizadosVendidos}`);
        console.log(`   - Boletos liberados (vendidos sin orden): ${huerfanosVendidos}\n`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error en sincronización:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
sincronizar();
