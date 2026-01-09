#!/usr/bin/env node
/**
 * Script de debug: Verificar boletos marcados como 'apartado'
 * Uso: node debug-apartados.js
 */

const db = require('./db');

async function main() {
    try {
        console.log('🔍 Verificando boletos en estado "apartado"...\n');

        // Contar total
        const total = await db('boletos_estado')
            .where('estado', 'apartado')
            .count('* as count')
            .first();

        console.log(`📊 Total de boletos apartados: ${total.count}`);

        // Últimas 5 órdenes con boletos apartados
        const ordenes = await db('boletos_estado')
            .where('estado', 'apartado')
            .select('numero_orden', 'numero', 'estado', 'reservado_en')
            .orderBy('reservado_en', 'desc')
            .limit(20);

        if (ordenes.length === 0) {
            console.log('❌ No hay boletos apartados');
            process.exit(0);
        }

        // Agrupar por número de orden
        const porOrden = {};
        ordenes.forEach(b => {
            if (!porOrden[b.numero_orden]) {
                porOrden[b.numero_orden] = [];
            }
            porOrden[b.numero_orden].push(b.numero);
        });

        console.log('\n📋 Boletos por orden (últimos registros):');
        Object.entries(porOrden).forEach(([orden, boletos]) => {
            console.log(`\n  Orden: ${orden}`);
            console.log(`  Boletos: ${boletos.join(', ')}`);
            console.log(`  Cantidad: ${boletos.length}`);
        });

        console.log('\n✅ Debug completado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
