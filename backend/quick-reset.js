const db = require('./db');

async function reset() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    await db('boletos_estado').del();
    await db('ordenes').del();
    
    console.log('✅ Base de datos limpia');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

reset();
