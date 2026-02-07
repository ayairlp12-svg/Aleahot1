const db = require('./db');

(async () => {
  try {
    console.log('\n🔧 ELIMINANDO OPORTUNIDADES DUPLICADAS...\n');

    const duplicadas = [254198, 451092, 654109, 781265, 987123];

    let totalEliminadas = 0;

    for (const numOpp of duplicadas) {
      // Obtener todos los registros de esta oportunidad
      const registros = await db('orden_oportunidades')
        .where('numero_oportunidad', numOpp)
        .select('id', 'numero_orden', 'estado')
        .orderBy('id', 'asc');

      console.log(`📌 Opp ${numOpp}: ${registros.length} registros`);

      if (registros.length > 1) {
        // Eliminar todos excepto el primero
        const idsAEliminar = registros.slice(1).map(r => r.id);
        const deleted = await db('orden_oportunidades')
          .whereIn('id', idsAEliminar)
          .delete();

        console.log(`   ✅ Eliminados ${deleted} duplicados (manteniendo id ${registros[0].id})`);
        totalEliminadas += deleted;
      }
    }

    console.log(`\n✅ Total eliminados: ${totalEliminadas} registros duplicados`);

    // Verificar
    const dupRestantes = await db('orden_oportunidades')
      .select('numero_oportunidad')
      .count('* as cantidad')
      .groupBy('numero_oportunidad')
      .having(db.raw('COUNT(*) > 1'));

    console.log(`✅ Duplicadas restantes: ${dupRestantes.length}`);
    console.log('\n✨ Base de datos limpia\n');

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
