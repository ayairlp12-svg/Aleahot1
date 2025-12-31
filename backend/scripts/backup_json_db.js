#!/usr/bin/env node
// Respaldo JSON simple de todas las tablas de la BD PostgreSQL.
// No reemplaza pg_dump, pero es útil cuando las utilidades cliente no están disponibles.

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está definido en backend/.env');
  process.exit(2);
}

const Knex = require('knex');
const knex = Knex({
  client: 'pg',
  connection: DATABASE_URL,
  pool: { min: 0, max: 5 }
});

(async function(){
  try {
    const TS = new Date().toISOString().replace(/[:.]/g,'');
    const outDir = path.join(__dirname, '..', `db_exports_${TS}`);
    fs.mkdirSync(outDir, { recursive: true });

    console.log('Conectando a la BD y listando tablas...');
    const tables = await knex('information_schema.tables')
      .select('table_name')
      .where({ table_schema: 'public', table_type: 'BASE TABLE' });

    for (const t of tables) {
      const name = t.table_name;
      console.log('Exportando tabla', name);
      const rows = await knex.select('*').from(name).limit(1000000);
      const filePath = path.join(outDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf8');
    }

    console.log('Export completed to', outDir);
    await knex.destroy();
    process.exit(0);
  } catch (e) {
    console.error('Error durante export JSON:', e && e.message);
    try { await knex.destroy(); } catch(_){}
    process.exit(3);
  }
})();
