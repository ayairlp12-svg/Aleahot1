const db = require('./db');

(async () => {
  try {
    console.log('⏳ Recreando la búsqueda de faltantes...\n');
    
    // Obtener todos los números en BD
    const existentes = await db('orden_oportunidades')
      .pluck('numero_oportunidad');
    
    const existentesSet = new Set(existentes);
    console.log(`Total en BD: ${existentes.length}`);
    
    // Iterar del 250k al 999k (igual al script original)
    const faltantes = [];
    for (let i = 250000; i <= 999999; i++) {
      if (!existentesSet.has(i)) {
        faltantes.push(i);
      }
    }
    
    console.log(`Faltantes encontrados: ${faltantes.length}\n`);
    console.log('✅ Los 3 números insertados fueron:');
    faltantes.forEach((num, idx) => {
      console.log(`   ${idx + 1}. ${num}`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
