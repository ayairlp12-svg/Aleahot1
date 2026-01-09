const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://rifa_web_op_user:2eTqUwZ58gk2UTleIcvYYuyuaZMudnT2@dpg-d5fn80i4d50c73f9tfh0-a.virginia-postgres.render.com/rifa_web_op?sslmode=require'
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Conectado a BD\n');
    
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
      ORDER BY table_name
    `);
    
    if (rows.length === 0) {
      console.log('⚠️  No hay tablas en la BD');
    } else {
      console.log(`📊 Tablas (${rows.length}):`);
      rows.forEach(r => console.log(`  - ${r.table_name}`));
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
