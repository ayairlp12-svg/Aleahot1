#!/usr/bin/env node
/**
 * Script: Inicializar boletos en BD remota (Render)
 * Uso: 
 *   NODE_ENV=production DATABASE_URL="postgresql://..." node scripts/init-boletos-remote.js
 * O localmente:
 *   node scripts/init-boletos-remote.js
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

console.log(`\n🔧 Inicializando boletos en ambiente: ${environment}`);
console.log(`📊 Total de boletos a crear: 60,000`);

async function inicializarBoletos() {
    const db = knex(config);

    try {
        // 1. Verificar que la tabla existe
        const tableExists = await db.schema.hasTable('boletos_estado');
        if (!tableExists) {
            console.log('❌ Tabla boletos_estado no existe. Ejecutando migraciones...');
            console.log('Ejecuta primero: npm run migrate');
            process.exit(1);
        }
        console.log('✅ Tabla boletos_estado existe');

        // 2. Limpiar boletos existentes (opcional, comenta si no quieres borrar)
        console.log('🧹 Limpiando boletos existentes...');
        await db('boletos_estado').del();

        // 3. Crear 60,000 boletos en lotes
        console.log('🔄 Insertando 60,000 boletos en lotes de 1000...');
        const LOTE = 1000;
        const TOTAL = 60000;
        let creados = 0;

        for (let start = 1; start <= TOTAL; start += LOTE) {
            const end = Math.min(start + LOTE - 1, TOTAL);
            const boletos = [];

            for (let i = start; i <= end; i++) {
                boletos.push({
                    numero: i,
                    estado: 'disponible',
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }

            await db('boletos_estado').insert(boletos);
            creados += boletos.length;

            const porcentaje = Math.round((creados / TOTAL) * 100);
            console.log(`   ✅ ${creados}/${TOTAL} (${porcentaje}%)`);
        }

        console.log('\n✅ COMPLETADO: 60,000 boletos inicializados exitosamente');

        // 4. Verificar
        const total = await db('boletos_estado').count('* as cnt').first();
        const disponibles = await db('boletos_estado').where('estado', 'disponible').count('* as cnt').first();

        console.log(`\n📊 Estadísticas finales:`);
        console.log(`   Total boletos: ${total.cnt}`);
        console.log(`   Disponibles: ${disponibles.cnt}`);
        console.log(`   Reservados: ${total.cnt - disponibles.cnt}`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);

    } finally {
        await db.destroy();
    }
}

inicializarBoletos();
