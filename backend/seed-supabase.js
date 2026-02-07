#!/usr/bin/env node

/**
 * Script para poblar tablas de boletos y oportunidades en Supabase
 * boletos_estado: 0 a 249,999 (250k)
 * orden_oportunidades: 250,000 a 999,999 (750k)
 */

require('dotenv').config({ path: '.env' });
const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

const BATCH_SIZE = 5000; // Insertar en lotes de 5k para mejor performance

async function populateBoletosEstado() {
  console.log('\n🎟️  Poblando boletos_estado (0 - 249,999)...');
  
  try {
    const startTime = Date.now();
    let inserted = 0;
    
    // Insertar en lotes
    for (let i = 0; i < 250000; i += BATCH_SIZE) {
      const batch = [];
      const end = Math.min(i + BATCH_SIZE, 250000);
      
      for (let num = i; num < end; num++) {
        batch.push({
          numero: num,
          estado: 'disponible',
          numero_orden: null,
          created_at: new Date()
        });
      }
      
      await db('boletos_estado').insert(batch);
      inserted += batch.length;
      
      const progress = Math.round((inserted / 250000) * 100);
      process.stdout.write(`\r   ${progress}% (${inserted.toLocaleString()} boletos)`);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ boletos_estado completado en ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ Error poblando boletos_estado:', error.message);
    throw error;
  }
}

async function populateOportunidades() {
  console.log('\n🎰 Poblando orden_oportunidades (250,000 - 999,999)...');
  
  try {
    const startTime = Date.now();
    let inserted = 0;
    
    // Insertar en lotes
    for (let i = 250000; i < 1000000; i += BATCH_SIZE) {
      const batch = [];
      const end = Math.min(i + BATCH_SIZE, 1000000);
      
      for (let num = i; num < end; num++) {
        batch.push({
          numero_oportunidad: num,
          estado: 'disponible',
          numero_orden: null,
          created_at: new Date()
        });
      }
      
      await db('orden_oportunidades').insert(batch);
      inserted += batch.length;
      
      const progress = Math.round((inserted / 750000) * 100);
      process.stdout.write(`\r   ${progress}% (${inserted.toLocaleString()} oportunidades)`);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ orden_oportunidades completado en ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ Error poblando orden_oportunidades:', error.message);
    throw error;
  }
}

async function verifyData() {
  console.log('\n📊 Verificando datos...');
  
  try {
    const boletoCount = await db('boletos_estado').count('* as total').first();
    const oportunidadCount = await db('orden_oportunidades').count('* as total').first();
    
    console.log(`   ✅ boletos_estado: ${parseInt(boletoCount.total).toLocaleString()} registros`);
    console.log(`   ✅ orden_oportunidades: ${parseInt(oportunidadCount.total).toLocaleString()} registros`);
    console.log(`   ✅ Total: ${(parseInt(boletoCount.total) + parseInt(oportunidadCount.total)).toLocaleString()} registros`);
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
    throw error;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Poblando Base de Datos de RifaPlus en Supabase     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    // Verificar conexión
    console.log('\n🔌 Verificando conexión a Supabase...');
    await db.raw('SELECT NOW()');
    console.log('✅ Conectado exitosamente');
    
    // Poblar tablas
    await populateBoletosEstado();
    await populateOportunidades();
    
    // Verificar
    await verifyData();
    
    console.log('\n✨ ¡Poblado completado exitosamente!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

main();
