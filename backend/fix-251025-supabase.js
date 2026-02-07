#!/usr/bin/env node
/**
 * Script para diagnosticar y corregir números 251025-251088 en SUPABASE
 * Ejecuta: node fix-251025-supabase.js
 */

require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Supabase requiere SSL
    });

    try {
        await client.connect();
        console.log('\n✅ Conectado a Supabase\n');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 DIAGNÓSTICO: Rango 251025-251088 en SUPABASE');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Paso 1: Contar total
        const totalRes = await client.query(
            `SELECT COUNT(*) as cnt 
             FROM orden_oportunidades 
             WHERE numero_oportunidad BETWEEN 251025 AND 251088`
        );
        const totalEnRango = totalRes.rows[0].cnt;

        console.log(`📊 Total en rango: ${totalEnRango}`);
        console.log(`   Esperado: 64 (251088 - 251025 + 1)\n`);

        // Paso 2: Ver por estado
        const estadoRes = await client.query(
            `SELECT estado, COUNT(*) as cnt 
             FROM orden_oportunidades 
             WHERE numero_oportunidad BETWEEN 251025 AND 251088
             GROUP BY estado`
        );

        console.log('📋 Por estado:');
        const estadoMap = {};
        estadoRes.rows.forEach(row => {
            estadoMap[row.estado] = row.cnt;
            console.log(`   ${row.estado}: ${row.cnt}`);
        });

        // Paso 3: Ver si hay "apartado" sin numero_orden (BUG)
        const bugRes = await client.query(
            `SELECT COUNT(*) as cnt 
             FROM orden_oportunidades 
             WHERE numero_oportunidad BETWEEN 251025 AND 251088
             AND estado = 'apartado'
             AND numero_orden IS NULL`
        );
        const apartadoSinOrden = bugRes.rows[0].cnt;

        console.log(`\n⚠️  "Apartado" sin numero_orden: ${apartadoSinOrden}`);

        if (apartadoSinOrden > 0) {
            console.log('\n❌ PROBLEMA DETECTADO:');
            console.log(`   ${apartadoSinOrden} números están como "apartado" sin ninguna orden asignada`);
            console.log('   Esto causa que se marquen como no disponibles aunque no tienen dueño\n');

            // Corregir
            console.log('🔧 CORRIGIENDO EN SUPABASE...\n');
            const updateRes = await client.query(
                `UPDATE orden_oportunidades
                 SET estado = 'disponible', numero_orden = NULL
                 WHERE numero_oportunidad BETWEEN 251025 AND 251088
                 AND estado = 'apartado'
                 AND numero_orden IS NULL`
            );

            console.log(`✅ Corregidos: ${updateRes.rowCount} números\n`);

            // Verificar
            const verifyRes = await client.query(
                `SELECT COUNT(*) as cnt 
                 FROM orden_oportunidades 
                 WHERE numero_oportunidad BETWEEN 251025 AND 251088
                 AND estado = 'disponible'
                 AND numero_orden IS NULL`
            );

            console.log(`✅ Ahora disponibles y sin orden: ${verifyRes.rows[0].cnt}\n`);
        } else {
            console.log('\n✅ No hay números "apartado" sin orden - sin problemas\n');
        }

        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        process.exit(0);
    }
}

main();
