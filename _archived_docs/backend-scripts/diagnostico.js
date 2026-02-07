#!/usr/bin/env node
/**
 * Script: Diagnóstico de salud del sistema de boletos
 * 
 * Verifica que:
 * 1. boletos_estado está correctamente sincronizada
 * 2. No hay inconsistencias entre órdenes y boletos
 * 3. Boletos en caché vs realidad coinciden
 * 4. Sistema está listo para producción
 */

const db = require('../db');
const fetch = require('node-fetch') || require('whatwg-fetch');

async function diagnosticar() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  DIAGNÓSTICO DE SALUD - SISTEMA DE BOLETOS RIFAPLUS        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
        // ========== 1. VERIFICAR TABLA boletos_estado ==========
        console.log('1️⃣  TABLA boletos_estado');
        console.log('   ────────────────────');

        const estadoBoletosQuery = await db.raw(`
            SELECT estado, COUNT(*) as count 
            FROM boletos_estado 
            GROUP BY estado 
            ORDER BY estado
        `);

        let totalBoletosTab = 0;
        const estadoBoletosMap = {};
        for (const row of estadoBoletosQuery.rows) {
            estadoBoletosMap[row.estado] = row.count;
            totalBoletosTab += row.count;
            console.log(`   • ${row.estado}: ${row.count}`);
        }
        console.log(`   • TOTAL: ${totalBoletosTab}/60000`);

        // ========== 2. VERIFICAR TABLA ordenes ==========
        console.log('\n2️⃣  TABLA ordenes');
        console.log('   ────────────────');

        const estadoOrdenesQuery = await db.raw(`
            SELECT estado, COUNT(*) as count 
            FROM ordenes 
            GROUP BY estado 
            ORDER BY estado
        `);

        for (const row of estadoOrdenesQuery.rows) {
            console.log(`   • ${row.estado}: ${row.count}`);
        }

        // ========== 3. DETECTAR INCONSISTENCIAS ==========
        console.log('\n3️⃣  BÚSQUEDA DE INCONSISTENCIAS');
        console.log('   ────────────────────────────────');

        // 3a. Boletos reservados sin orden válida
        const boletosReservadosHuerfanos = await db.raw(`
            SELECT COUNT(*) as count FROM boletos_estado
            WHERE estado = 'reservado'
            AND (
              numero_orden IS NULL
              OR NOT EXISTS (
                SELECT 1 FROM ordenes o 
                WHERE o.numero_orden = boletos_estado.numero_orden 
                AND o.estado IN ('pendiente', 'comprobante_recibido')
              )
            )
        `);
        const countReservadosHuerfanos = boletosReservadosHuerfanos.rows[0]?.count || 0;
        
        if (countReservadosHuerfanos > 0) {
            console.log(`   ❌ ${countReservadosHuerfanos} boletos RESERVADOS sin orden válida`);
        } else {
            console.log(`   ✅ 0 boletos reservados huérfanos`);
        }

        // 3b. Boletos vendidos sin orden confirmada
        const boletosVendidosHuerfanos = await db.raw(`
            SELECT COUNT(*) as count FROM boletos_estado
            WHERE estado = 'vendido'
            AND (
              numero_orden IS NULL
              OR NOT EXISTS (
                SELECT 1 FROM ordenes o 
                WHERE o.numero_orden = boletos_estado.numero_orden 
                AND o.estado = 'confirmada'
              )
            )
        `);
        const countVendidosHuerfanos = boletosVendidosHuerfanos.rows[0]?.count || 0;
        
        if (countVendidosHuerfanos > 0) {
            console.log(`   ❌ ${countVendidosHuerfanos} boletos VENDIDOS sin orden confirmada`);
        } else {
            console.log(`   ✅ 0 boletos vendidos huérfanos`);
        }

        // 3c. Órdenes sin boletos correspondientes
        const boletosEnOrdenesConfirmadasSinVendido = await db.raw(`
            SELECT o.numero_orden, COUNT(b.numero) as boletos_vendidos, 
                   COUNT(DISTINCT CAST(json_array_elements(o.boletos)::text as INTEGER)) as boletos_en_orden
            FROM ordenes o
            LEFT JOIN boletos_estado b ON b.numero_orden = o.numero_orden AND b.estado = 'vendido'
            WHERE o.estado = 'confirmada'
            GROUP BY o.numero_orden
            HAVING COUNT(b.numero) != COUNT(DISTINCT CAST(json_array_elements(o.boletos)::text as INTEGER))
        `);

        if (boletosEnOrdenesConfirmadasSinVendido.rowCount > 0) {
            console.log(`   ❌ ${boletosEnOrdenesConfirmadasSinVendido.rowCount} órdenes confirmadas con inconsistencia en boletos`);
            for (const row of boletosEnOrdenesConfirmadasSinVendido.rows) {
                console.log(`      - Orden ${row.numero_orden}: ${row.boletos_vendidos}/${row.boletos_en_orden} boletos marcados vendido`);
            }
        } else {
            console.log(`   ✅ Todas las órdenes confirmadas tienen sus boletos marcados como vendido`);
        }

        // ========== 4. VERIFICAR ENDPOINTS ==========
        console.log('\n4️⃣  ENDPOINTS API');
        console.log('   ────────────────');

        try {
            const publicBoletosResponse = await fetch('http://127.0.0.1:5001/api/public/boletos')
                .then(r => r.json())
                .catch(() => null);

            if (publicBoletosResponse && publicBoletosResponse.success) {
                const sold = publicBoletosResponse.data?.sold || [];
                const reserved = publicBoletosResponse.data?.reserved || [];
                const stats = publicBoletosResponse.stats || {};

                console.log(`   ✅ GET /api/public/boletos`);
                console.log(`      • Vendidos: ${sold.length}`);
                console.log(`      • Reservados: ${reserved.length}`);
                console.log(`      • Disponibles: ${stats.disponibles || 60000 - sold.length}`);

                // Verificar coherencia con boletos_estado
                if (sold.length !== (estadoBoletosMap['vendido'] || 0)) {
                    console.log(`      ⚠️  Mismatch: endpoint dice ${sold.length} vendidos, BD tiene ${estadoBoletosMap['vendido']}`);
                } else {
                    console.log(`      • Sincronizado ✅`);
                }
            } else {
                console.log(`   ❌ GET /api/public/boletos está caído o devolvió error`);
            }
        } catch (e) {
            console.log(`   ❌ GET /api/public/boletos error: ${e.message}`);
        }

        // ========== 5. RESUMEN FINAL ==========
        console.log('\n5️⃣  RESUMEN FINAL');
        console.log('   ──────────────');

        const totalProblemas = countReservadosHuerfanos + countVendidosHuerfanos + 
                               boletosEnOrdenesConfirmadasSinVendido.rowCount;

        if (totalProblemas === 0) {
            console.log(`
   ✅ SISTEMA SALUDABLE
   
   • 0 inconsistencias detectadas
   • boletos_estado está perfectamente sincronizada
   • Órdenes y boletos son coherentes
   • LISTO PARA PRODUCCIÓN ✨
            `);
        } else {
            console.log(`
   ⚠️  PROBLEMAS DETECTADOS: ${totalProblemas}
   
   Recomendación: Ejecutar endpoint de sincronización
   curl http://127.0.0.1:5001/api/boletos/sync-full
            `);
        }

        // ========== 6. INFORMACIÓN DE SISTEMA ==========
        console.log('\n6️⃣  INFORMACIÓN DE SISTEMA');
        console.log('   ──────────────────────────');

        const pgVersion = await db.raw('SELECT version()');
        console.log(`   • Base de datos: PostgreSQL`);
        console.log(`   • Boletos totales: ${totalBoletosTab}/60000`);
        console.log(`   • Disponibles: ${estadoBoletosMap['disponible'] || 0}`);
        console.log(`   • Reservados: ${estadoBoletosMap['reservado'] || 0}`);
        console.log(`   • Vendidos: ${estadoBoletosMap['vendido'] || 0}`);

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║  FIN DEL DIAGNÓSTICO                                       ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR FATAL EN DIAGNÓSTICO:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Ejecutar
diagnosticar();
