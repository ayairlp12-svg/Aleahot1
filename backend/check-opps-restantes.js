const db = require('./db');

(async () => {
  try {
    const opps = await db('orden_oportunidades')
      .whereNotNull('numero_orden')
      .select('numero_orden', 'numero_oportunidad', 'estado');

    console.log('\n📋 Oportunidades aún asignadas:');
    opps.forEach(o => {
      console.log(`  - Orden: ${o.numero_orden}, Opp: ${o.numero_oportunidad}, Estado: ${o.estado}`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
