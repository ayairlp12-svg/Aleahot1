const db = require('./db');

(async () => {
  try {
    console.log('\n🔍 BUSCANDO OPORTUNIDADES DUPLICADAS O FUERA DE RANGO...\n');

    // Duplicadas (mismo numero_oportunidad aparece más de una vez)
    const duplicadas = await db('orden_oportunidades')
      .select('numero_oportunidad')
      .count('* as cantidad')
      .groupBy('numero_oportunidad')
      .having(db.raw('COUNT(*) > 1'));

    console.log(`📊 Oportunidades duplicadas:`);
    if (duplicadas.length === 0) {
      console.log('   Ninguna');
    } else {
      console.log(`   Encontradas: ${duplicadas.length}`);
      duplicadas.forEach(d => {
        console.log(`   - Opp ${d.numero_oportunidad}: aparece ${d.cantidad} veces`);
      });
    }

    // Fuera de rango
    const fuera = await db('orden_oportunidades')
      .where('numero_oportunidad', '<', 250000)
      .orWhere('numero_oportunidad', '>', 999999)
      .select('numero_oportunidad');

    console.log(`\n📊 Oportunidades fuera de rango (250k-999k):`);
    if (fuera.length === 0) {
      console.log('   Ninguna');
    } else {
      console.log(`   Encontradas: ${fuera.length}`);
      console.log('   Números:', fuera.map(f => f.numero_oportunidad).sort((a,b) => a-b));
    }

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
