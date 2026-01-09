require('dotenv').config();
const { Client } = require('pg');

const TOTAL_BOLETOS = 1000000;

async function crearBoletos() {
  const connectionString = process.env.DATABASE_URL + '?sslmode=require';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('🔄 Iniciando creación de boletos...');
    console.log(`📊 Total a crear: ${TOTAL_BOLETOS.toLocaleString('es-MX')}`);
    
    // Verificar si ya existen boletos
    const { rows: [{ total: existentes }] } = await client.query(
      'SELECT COUNT(*) as total FROM boletos_estado'
    );
    
    if (existentes > 0) {
      console.log(`⚠️  Ya existen ${existentes.toLocaleString('es-MX')} boletos en la BD`);
      console.log('🗑️  Limpiando tabla...');
      await client.query('TRUNCATE TABLE boletos_estado CASCADE');
      console.log('✅ Tabla limpiada\n');
    }
    
    const inicio = Date.now();
    
    // Usar generate_series para crear 1 millón de boletos de una sola vez
    // Mucho más rápido que insertar en batches
    console.log('⏳ Insertando boletos usando generate_series...');
    
    await client.query(`
      INSERT INTO boletos_estado (numero, estado, created_at, updated_at)
      SELECT 
        num,
        'disponible'::text,
        NOW(),
        NOW()
      FROM generate_series(0, ${TOTAL_BOLETOS - 1}) as num
    `);
    
    const tiempoTotal = Math.round((Date.now() - inicio) / 1000);
    console.log(`\n✅ ¡Boletos creados exitosamente!`);
    console.log(`⏱️  Tiempo total: ${tiempoTotal}s`);
    
    // Verificar
    const { rows: [{ total: finales }] } = await client.query(
      'SELECT COUNT(*) as total FROM boletos_estado'
    );
    console.log(`📊 Verificación final: ${finales.toLocaleString('es-MX')} boletos en BD`);
    
    // Mostrar rango
    const { rows: [{ min, max }] } = await client.query(
      'SELECT MIN(numero) as min, MAX(numero) as max FROM boletos_estado'
    );
    console.log(`📍 Rango: ${min} - ${max}`);
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

crearBoletos();
