const db = require('./db.js');

(async () => {
  try {
    // Ver oportunidades en rango 251025-251088
    const opps = await db('orden_oportunidades')
      .whereBetween('numero', [251025, 251088])
      .select('numero', 'estado', 'numero_orden')
      .orderBy('numero');
    
    console.log('=== Oportunidades 251025-251088 ===');
    console.log(`Total encontradas: ${opps.length}`);
    if (opps.length > 0) {
      console.log('Primeras 10:');
      opps.slice(0, 10).forEach(o => {
        console.log(`  ${o.numero}: ${o.estado} (orden: ${o.numero_orden || 'NULL'})`);
      });
      console.log('Últimas 10:');
      opps.slice(-10).forEach(o => {
        console.log(`  ${o.numero}: ${o.estado} (orden: ${o.numero_orden || 'NULL'})`);
      });
    }
    
    // Ver si hay órdenes asignadas a esos números
    const conOrden = opps.filter(o => o.numero_orden !== null);
    console.log(`\n📌 Con numero_orden asignado: ${conOrden.length}`);
    if (conOrden.length > 0) {
      const ordenes = {};
      conOrden.forEach(o => {
        if (!ordenes[o.numero_orden]) ordenes[o.numero_orden] = 0;
        ordenes[o.numero_orden]++;
      });
      Object.entries(ordenes).forEach(([orden, count]) => {
        console.log(`  ${orden}: ${count} números`);
      });
    }
    
    // Contar por estado
    const porEstado = {};
    opps.forEach(o => {
      porEstado[o.estado] = (porEstado[o.estado] || 0) + 1;
    });
    console.log(`\n📊 Por estado:`);
    Object.entries(porEstado).forEach(([estado, count]) => {
      console.log(`  ${estado}: ${count}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
