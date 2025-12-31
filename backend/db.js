const knex = require('knex');
const knexConfig = require('./knexfile');

// Conectar siempre a Postgres. `knexfile.js` ya está configurado para usar Postgres
// tanto en `development` como en `production`. Se requiere `DATABASE_URL` o
// variables de conexión locales para desarrollo.
const environment = process.env.NODE_ENV || 'development';
const configToUse = knexConfig[environment];

if (process.env.DATABASE_URL) {
	console.log('✅ DB: Conectando a PostgreSQL desde DATABASE_URL');
	console.log(`   URL: ${process.env.DATABASE_URL.substring(0, 60)}...`);
} else {
	console.log('✅ DB: Conectando a PostgreSQL local (fallback dev)');
	console.log(`   Database: ${process.env.DB_NAME || 'rifaplus_dev'}`);
}

module.exports = knex(configToUse);