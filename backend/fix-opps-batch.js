const db = require('./db');

(async () => {
  try {
    console.log('⏳ Encontrando números faltantes...');
    
    // Obtener qué números ya existen
    const existentes = await db('orden_oportunidades')
      .pluck('numero_oportunidad');
    
    const existentesSet = new Set(existentes);
    console.log(`   Números en BD: ${existentes.length}`);
    
    // Encontrar faltantes
    const faltantes = [];
    for (let i = 250000; i <= 999999; i++) {
      if (!existentesSet.has(i)) {
        faltantes.push(i);
      }
    }
    
    console.log(`   Números faltantes: ${faltantes.length}`);
    
    if (faltantes.length === 0) {
      console.log(`✅ Sistema ya completo: 750,000 oportunidades`);
      process.exit(0);
    }
    
    // Insertar en batches
    console.log(`\n⏳ Insertando ${faltantes.length} números...`);
    const ahora = new Date();
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < faltantes.length; i += BATCH_SIZE) {
      const batch = faltantes.slice(i, i + BATCH_SIZE);
      const registros = batch.map(num => ({
        numero_oportunidad: num,
        estado: 'disponible',
        numero_orden: null,
        created_at: ahora,
        updated_at: ahora
      }));
      
      try {
        await db('orden_oportunidades').insert(registros);
        console.log(`   Insertados batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      } catch (e) {
        if (e.code !== '23505') { // Ignorar conflictos de unique
          throw e;
        }
      }
    }
    
    // Verificar total final
    const total = await db('orden_oportunidades').count('* as cnt').first();
    console.log(`\n✅ Total oportunidades: ${total.cnt}`);
    
    if (total.cnt === 750000) {
      console.log(`✨ ¡Sistema COMPLETO: 750,000 oportunidades!`);
    } else {
      console.log(`⚠️  Faltan ${750000 - total.cnt} oportunidades`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
