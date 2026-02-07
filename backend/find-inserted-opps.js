const db = require('./db');

(async () => {
  try {
    // Obtener números con timestamp TODAY (hace poco)
    const ahora = new Date();
    const hace1minuto = new Date(ahora.getTime() - 60000); // Hace 1 minuto

    const recientesHoy = await db('orden_oportunidades')
      .where('created_at', '>', hace1minuto)
      .orderBy('numero_oportunidad')
      .pluck('numero_oportunidad');
    
    console.log(`✅ Números insertados en el último minuto:`);
    if (recientesHoy.length > 0) {
      console.log(`   ${recientesHoy.join(', ')}`);
    } else {
      // Intentar con 5 minutos
      const hace5min = new Date(ahora.getTime() - 5 * 60000);
      const recientes5 = await db('orden_oportunidades')
        .where('created_at', '>', hace5min)
        .orderBy('numero_oportunidad')
        .pluck('numero_oportunidad');
      
      if (recientes5.length > 0) {
        console.log(`   ${recientes5.join(', ')}`);
      } else {
        // Mostrar el timestamp del más reciente
        const masReciente = await db('orden_oportunidades')
          .orderBy('created_at', 'desc')
          .first()
          .select('numero_oportunidad', 'created_at');
        
        console.log(`   Más reciente: ${masReciente.numero_oportunidad}`);
        console.log(`   Timestamp: ${masReciente.created_at}`);
      }
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
