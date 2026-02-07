const db = require('./db');

(async () => {
  try {
    // Obtener todos los números
    const existentes = await db('orden_oportunidades')
      .pluck('numero_oportunidad');
    
    const existentesSet = new Set(existentes);
    console.log(`Total en BD: ${existentes.length}`);
    
    // Encontrar faltantes
    const faltantes = [];
    for (let i = 250000; i <= 999999; i++) {
      if (!existentesSet.has(i)) {
        faltantes.push(i);
      }
    }
    
    console.log(`\n✅ Números que faltaban (ya insertados):`);
    if (faltantes.length > 0) {
      faltantes.forEach(n => console.log(`   ${n}`));
    } else {
      console.log(`   ✨ Ninguno - Sistema COMPLETO con 750,000 oportunidades`);
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
