const db = require('./db');

(async () => {
  try {
    const boletos = await db('boletos_estado')
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN estado = 'disponible' AND numero_orden IS NULL THEN 1 ELSE 0 END) as disponibles_sin_orden"),
        db.raw('SUM(CASE WHEN numero_orden IS NOT NULL THEN 1 ELSE 0 END) as con_orden_asignada')
      )
      .first();

    const opps = await db('orden_oportunidades')
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("SUM(CASE WHEN estado = 'disponible' AND numero_orden IS NULL THEN 1 ELSE 0 END) as disponibles_sin_orden"),
        db.raw('SUM(CASE WHEN numero_orden IS NOT NULL THEN 1 ELSE 0 END) as con_orden_asignada')
      )
      .first();

    console.log('\n📊 BOLETOS_ESTADO:');
    console.log(boletos);
    console.log('\n📊 ORDEN_OPORTUNIDADES:');
    console.log(opps);
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
