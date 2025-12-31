require('dotenv').config();
const db = require('./db');

(async () => {
  const orden = await db('ordenes').where('numero_orden', 'ORD-1767123437611-26ovxre78').first();
  console.log('Estado actual:', orden?.estado);
  console.log('Boletos raw:', JSON.stringify(orden?.boletos));
  
  let boletos = [];
  try {
    boletos = JSON.parse(orden?.boletos || '[]');
    console.log('✅ Parsed como JSON array');
  } catch (e) {
    console.log('❌ Parse JSON failed, trying split...');
    if (typeof orden?.boletos === 'string' && orden?.boletos.length > 0) {
      boletos = orden?.boletos.split(',').map(n => {
        const num = parseInt(n.trim(), 10);
        return isNaN(num) ? null : num;
      }).filter(n => n !== null);
      console.log('✅ Parsed como string separado por comas');
    }
  }
  console.log('Boletos parsed:', boletos);
  process.exit(0);
})();
