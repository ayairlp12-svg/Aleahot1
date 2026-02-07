#!/usr/bin/env node
require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT numero_orden, estado, created_at, total_pagado
      FROM ordenes 
      WHERE numero_orden = 'ST-AA018'
    `);
    
    console.log('\n📊 Detalles de orden ST-AA018:');
    if (res.rows.length > 0) {
      const orden = res.rows[0];
      console.log(`  Número: ${orden.numero_orden}`);
      console.log(`  Estado: ${orden.estado}`);
      console.log(`  Total pagado: ${orden.total_pagado}`);
      console.log(`  Creada: ${new Date(orden.created_at).toISOString()}`);
    } else {
      console.log('  ❌ Orden NO encontrada en BD');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
})();
