const db = require('./db');

(async () => {
  try {
    console.log('\n🔧 LIMPIANDO OPORTUNIDADES CON ORDEN ASIGNADA...\n');

    // Ver cuáles son
    const oppsConOrden = await db('orden_oportunidades')
      .whereNotNull('numero_orden')
      .select('numero_orden', 'numero_oportunidad', 'estado');

    console.log(`📋 Oportunidades con orden asignada:`);
    oppsConOrden.forEach(o => {
      console.log(`   - Orden: ${o.numero_orden}, Opp: ${o.numero_oportunidad}, Estado: ${o.estado}`);
    });

    // Liberarlas (poner NULL y estado disponible)
    const updated = await db('orden_oportunidades')
      .whereNotNull('numero_orden')
      .update({
        numero_orden: null,
        estado: 'disponible',
        updated_at: new Date()
      });

    console.log(`\n✅ Liberadas ${updated} oportunidades`);

    // Verificar
    const oppsRestantes = await db('orden_oportunidades')
      .whereNotNull('numero_orden')
      .count('* as total')
      .first();

    console.log(`✅ Oportunidades con orden ahora: ${oppsRestantes.total}`);
    console.log('\n✨ Base de datos limpia\n');

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
