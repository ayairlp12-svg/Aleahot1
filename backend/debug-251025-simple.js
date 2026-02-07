const db = require('./db.js');

(async () => {
  try {
    // Contar números en rango 251025-251088
    const enRango = await db('orden_oportunidades')
      .whereBetween('numero_oportunidad', [251025, 251088])
      .count('* as total')
      .first();
    
    console.log(`Total en rango 251025-251088: ${enRango.total}`);
    
    // Contar por estado
    const porEstado = await db('orden_oportunidades')
      .whereBetween('numero_oportunidad', [251025, 251088])
      .select('estado')
      .count('* as cnt')
      .groupBy('estado');
    
    console.log('\nPor estado:');
    porEstado.forEach(row => {
      console.log(`  ${row.estado}: ${row.cnt}`);
    });
    
    // Ver números específicos
    console.log('\nPrimeros 5 del rango:');
    const primeros = await db('orden_oportunidades')
      .whereBetween('numero_oportunidad', [251025, 251030])
      .select('numero_oportunidad', 'estado', 'numero_orden');
    
    primeros.forEach(row => {
      console.log(`  ${row.numero_oportunidad}: ${row.estado} (orden: ${row.numero_orden || 'NULL'})`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
})();
