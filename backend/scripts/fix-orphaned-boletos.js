/**
 * Script: Limpiar boletos huérfanos (stuck en 'reservado' sin orden válida)
 * Estos boletos quedaron stuck cuando órdenes fueron liberadas pero los boletos no
 */

// ⚠️ PRIMERO cargar .env ANTES de cualquier otra cosa
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../db');

async function fixOrphanedBoletos() {
    console.log('🔍 Buscando boletos huérfanos (reservado sin orden válida)...\n');

    try {
        // Paso 1: Query directa - boletos 'reservado' que NO tienen una orden 'pendiente' o 'comprobante_recibido' o 'confirmada'
        const boletosHuerfanos = await db.raw(`
            SELECT be.numero, be.numero_orden, be.estado
            FROM boletos_estado be
            WHERE be.estado = 'reservado'
            AND (
                be.numero_orden IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM ordenes o 
                    WHERE o.numero_orden = be.numero_orden 
                    AND o.estado NOT IN ('cancelada')
                )
            )
        `);

        const numHuerfanos = boletosHuerfanos.rows ? boletosHuerfanos.rows.length : 0;
        console.log(`✅ Encontrados ${numHuerfanos} boletos huérfanos\n`);

        if (numHuerfanos === 0) {
            console.log('✅ No hay boletos huérfanos. Todo está sincronizado.');
            process.exit(0);
        }

        // Paso 2: Obtener los números para actualizar
        const numerosHuerfanos = boletosHuerfanos.rows.map(b => b.numero);
        
        console.log(`🔄 Liberando ${numerosHuerfanos.length} boletos a 'disponible'...\n`);

        // Actualizar en chunks para no sobrecargar
        const chunkSize = 1000;
        let totalActualizado = 0;

        for (let i = 0; i < numerosHuerfanos.length; i += chunkSize) {
            const chunk = numerosHuerfanos.slice(i, i + chunkSize);
            
            const actualizado = await db('boletos_estado')
                .whereIn('numero', chunk)
                .update({
                    estado: 'disponible',
                    numero_orden: null,
                    reservado_en: null,
                    updated_at: new Date()
                });
            
            totalActualizado += actualizado;
            console.log(`  ✓ Chunk ${Math.floor(i / chunkSize) + 1}: ${actualizado} boletos liberados`);
        }

        console.log(`\n✅ Total liberados: ${totalActualizado}/${numerosHuerfanos.length}`);
        console.log('\n🎉 Sincronización completa. Los boletos están disponibles en el frontend.');
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

fixOrphanedBoletos();
