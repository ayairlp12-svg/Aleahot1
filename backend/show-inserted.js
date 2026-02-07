const db = require('./db');

(async () => {
  try {
    // Obtener los 3 números con created_at más reciente
    const ultimos = await db('orden_oportunidades')
      .orderBy('created_at', 'desc')
      .limit(3)
      .select('numero_oportunidad', 'created_at');
    
    console.log('✅ Últimos 3 números insertados (acaba de hace unos segundos):');
    ultimos.forEach(row => {
      console.log(`   ${row.numero_oportunidad}`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
