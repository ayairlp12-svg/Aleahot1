#!/usr/bin/env node

// Script para ejecutar todas las migraciones en Supabase
// Uso: node run-migrations-supabase.js

require('dotenv').config({ path: '.env' });
const knex = require('knex');
const fs = require('fs');
const path = require('path');

const config = require('./knexfile');
const db = knex(config.development);

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migraciones en Supabase...\n');
    
    // Verificar conexión
    console.log('1️⃣  Verificando conexión a Supabase...');
    await db.raw('SELECT NOW()');
    console.log('✅ Conectado a Supabase correctamente\n');

    // Ejecutar migraciones
    console.log('2️⃣  Ejecutando todas las migraciones...');
    const [batchNo, log] = await db.migrate.latest();
    
    if (log.length === 0) {
      console.log('✅ Todas las migraciones ya estaban ejecutadas');
    } else {
      console.log(`✅ Se ejecutaron ${log.length} migraciones:`);
      log.forEach(migration => {
        console.log(`   • ${migration}`);
      });
    }

    console.log('\n3️⃣  Verificando tablas creadas...');
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`✅ Total de tablas: ${tables.rows.length}`);
    tables.rows.forEach(t => {
      console.log(`   • ${t.table_name}`);
    });

    console.log('\n✨ ¡Migraciones completadas exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante las migraciones:');
    console.error(error.message);
    console.error('\nDetalles:');
    console.error(error);
    process.exit(1);
  }
}

runMigrations();
