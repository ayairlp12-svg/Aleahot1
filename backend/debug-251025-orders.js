#!/usr/bin/env node
/**
 * Script para ver a qué órdenes pertenecen los números 251025-251088
 */

require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('\n✅ Conectado a Supabase\n');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 Ver órdenes asociadas a 251025-251088');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Ver a qué órdenes están asignados
        const orderRes = await client.query(
            `SELECT numero_orden, estado, COUNT(*) as cnt
             FROM orden_oportunidades 
             WHERE numero_oportunidad BETWEEN 251025 AND 251088
             GROUP BY numero_orden, estado
             ORDER BY numero_orden`
        );

        console.log('📋 Órdenes con estos números:');
        orderRes.rows.forEach(row => {
            console.log(`   Orden: ${row.numero_orden || 'NULL'} | Estado: ${row.estado} | Cantidad: ${row.cnt}`);
        });

        // Ver detalles de órdenes
        const ordersIds = orderRes.rows
            .filter(r => r.numero_orden !== null)
            .map(r => r.numero_orden);

        if (ordersIds.length > 0) {
            console.log('\n📊 Detalles de órdenes:');
            const detallesRes = await client.query(
                `SELECT numero_orden, estado, created_at, cliente_email
                 FROM ordenes 
                 WHERE numero_orden = ANY($1)`,
                [ordersIds]
            );

            detallesRes.rows.forEach(row => {
                console.log(`   ${row.numero_orden}: ${row.estado} | ${row.cliente_email} | ${new Date(row.created_at).toISOString()}`);
            });
        }

        // Opción: Liberar si están asignados a órdenes inexistentes
        console.log('\n🔍 Verificando integridad...');
        const huerfanosRes = await client.query(
            `SELECT COUNT(*) as cnt
             FROM orden_oportunidades oo
             WHERE numero_oportunidad BETWEEN 251025 AND 251088
             AND oo.numero_orden IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM ordenes o WHERE o.numero_orden = oo.numero_orden)`
        );

        console.log(`   Números "huérfanos" (orden no existe): ${huerfanosRes.rows[0].cnt}\n`);

        if (huerfanosRes.rows[0].cnt > 0) {
            console.log('⚠️  Hay números asignados a órdenes que no existen. Corrigiendo...\n');
            
            const fixRes = await client.query(
                `UPDATE orden_oportunidades
                 SET estado = 'disponible', numero_orden = NULL
                 WHERE numero_oportunidad BETWEEN 251025 AND 251088
                 AND numero_orden IS NOT NULL
                 AND NOT EXISTS (SELECT 1 FROM ordenes o WHERE o.numero_orden = numero_orden)`
            );

            console.log(`✅ Liberados: ${fixRes.rowCount} números\n`);
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
