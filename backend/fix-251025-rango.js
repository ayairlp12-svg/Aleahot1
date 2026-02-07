#!/usr/bin/env node
/**
 * Script para diagnosticar y corregir números 251025-251088
 * Executa: node fix-251025-rango.js
 */

const db = require('./db.js');

async function main() {
    try {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('🔍 DIAGNÓSTICO: Rango 251025-251088');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Paso 1: Contar total
        const totalEnRango = await db('orden_oportunidades')
            .whereBetween('numero_oportunidad', [251025, 251088])
            .count('* as cnt')
            .first();

        console.log(`📊 Total en rango: ${totalEnRango.cnt}`);
        console.log(`   Esperado: 64 (251088 - 251025 + 1)\n`);

        // Paso 2: Ver por estado
        const porEstado = await db('orden_oportunidades')
            .whereBetween('numero_oportunidad', [251025, 251088])
            .select('estado')
            .count('* as cnt')
            .groupBy('estado');

        console.log('📋 Por estado:');
        const estadoMap = {};
        porEstado.forEach(row => {
            estadoMap[row.estado] = row.cnt;
            console.log(`   ${row.estado}: ${row.cnt}`);
        });

        // Paso 3: Ver si hay "apartado" sin numero_orden (BUG)
        const apartadoSinOrden = await db('orden_oportunidades')
            .whereBetween('numero_oportunidad', [251025, 251088])
            .where('estado', 'apartado')
            .whereNull('numero_orden')
            .count('* as cnt')
            .first();

        console.log(`\n⚠️  "Apartado" sin numero_orden: ${apartadoSinOrden.cnt}`);

        if (apartadoSinOrden.cnt > 0) {
            console.log('\n❌ PROBLEMA DETECTADO:');
            console.log(`   ${apartadoSinOrden.cnt} números están como "apartado" sin ninguna orden asignada`);
            console.log('   Esto causa que se marquen como no disponibles aunque no tienen dueño\n');

            // Corregir
            console.log('🔧 CORRIGIENDO...\n');
            const resultado = await db('orden_oportunidades')
                .whereBetween('numero_oportunidad', [251025, 251088])
                .where('estado', 'apartado')
                .whereNull('numero_orden')
                .update({
                    estado: 'disponible',
                    numero_orden: null
                });

            console.log(`✅ Corregidos: ${resultado} números\n`);

            // Verificar
            const disponiblesAhora = await db('orden_oportunidades')
                .whereBetween('numero_oportunidad', [251025, 251088])
                .where('estado', 'disponible')
                .whereNull('numero_orden')
                .count('* as cnt')
                .first();

            console.log(`✅ Ahora disponibles: ${disponiblesAhora.cnt}\n`);
        } else {
            console.log('\n✅ No hay números "apartado" sin orden - sin problemas\n');
        }

        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();
