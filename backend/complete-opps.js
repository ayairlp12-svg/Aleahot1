const db = require('./db');

(async () => {
  try {
    console.log('⏳ Completando oportunidades faltantes...');
    
    // Usar SQL raw con generate_series para insertar los números faltantes
    const result = await db.raw(`
      INSERT INTO orden_oportunidades (numero_oportunidad, estado, numero_orden, created_at, updated_at)
      SELECT i, 'disponible', NULL, NOW(), NOW()
      FROM generate_series(250000, 999999) i
      WHERE NOT EXISTS (SELECT 1 FROM orden_oportunidades WHERE numero_oportunidad = i)
      ON CONFLICT (numero_oportunidad) DO NOTHING
    `);
    
    // Contar total
    const total = await db('orden_oportunidades').count('* as cnt').first();
    console.log(`✅ Total oportunidades: ${total.cnt}`);
    
    if (total.cnt === 750000) {
      console.log(`✨ ¡Sistema completo: 750,000 oportunidades!`);
    } else {
      console.log(`⚠️  Faltan ${750000 - total.cnt} oportunidades`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
