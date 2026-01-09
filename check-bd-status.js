const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Conectado a BD\n');
    
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Tablas (${tables.length}):\n`);
    
    for (const { table_name } of tables) {
      const { rows: countResult } = await client.query(`SELECT COUNT(*) as total FROM "${table_name}"`);
      const total = countResult[0].total;
      const indicator = total > 0 ? '✅' : '⚪';
      console.log(`  ${indicator} ${table_name}: ${total} registros`);
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
