const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://rifas_user:TjQ5ykEKufZh0wjCnOHh2HzfgxJy8bbJ@dpg-d5bgpver433s738v9psg-a.virginia-postgres.render.com/rifas_db_sllc?sslmode=require'
});

(async () => {
  try {
    console.log('🔍 Conectando a BD...');
    await client.connect();
    console.log('✅ Conectado!\n');
    
    // Get all tables
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
      ORDER BY table_name
    `);
    
    if (tables.length === 0) {
      console.log('⚠️  No hay tablas en la BD');
      await client.end();
      return;
    }
    
    console.log('📊 Tablas encontradas:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Count records in each table
    console.log('\n📈 Registros por tabla:');
    
    for (const row of tables) {
      const tableName = row.table_name;
      try {
        const { rows: countResult } = await client.query(`SELECT COUNT(*) as total FROM "${tableName}"`);
        const total = countResult[0].total;
        console.log(`  - ${tableName}: ${total} registros`);
      } catch (e) {
        console.log(`  - ${tableName}: Error al contar`);
      }
    }
    
    await client.end();
    console.log('\n✅ Listo!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
