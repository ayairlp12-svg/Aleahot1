const knex = require('knex')(require('./knexfile').development);

(async () => {
  try {
    // Obtener todos los números en BD
    const oppsEnBD = await knex('orden_oportunidades')
      .pluck('numero_oportunidad')
      .orderBy('numero_oportunidad');
    
    console.log(`📊 Total en BD: ${oppsEnBD.length}`);
    
    // Encontrar huecos (números que NO existen)
    const faltantes = [];
    for (let i = 250000; i <= 999999; i++) {
      if (!oppsEnBD.includes(i)) {
        faltantes.push(i);
      }
    }
    
    console.log(`❌ Faltantes: ${faltantes.length}`);
    if (faltantes.length > 0) {
      console.log(`   Números: [${faltantes.join(', ')}]`);
    }
    
    // Crear los faltantes
    if (faltantes.length > 0) {
      console.log(`\n✅ Insertando ${faltantes.length} números faltantes...`);
      const ahora = new Date();
      
      const registrosNuevos = faltantes.map(num => ({
        numero_oportunidad: num,
        estado: 'disponible',
        numero_orden: null,
        created_at: ahora,
        updated_at: ahora
      }));
      
      await knex('orden_oportunidades').insert(registrosNuevos);
      
      console.log(`✅ Insertados ${registrosNuevos.length} registros`);
      
      // Verificar total final
      const total = await knex('orden_oportunidades').count('* as cnt').first();
      console.log(`\n📊 Total ahora: ${total.cnt}`);
      console.log(`✨ Sistema completo: 750,000 oportunidades`);
    } else {
      console.log(`\n✅ Sistema completo: 750,000 oportunidades`);
    }
    
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
