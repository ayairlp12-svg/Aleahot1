const path = require('path');

// ✅ AMBOS AMBIENTES USAN POSTGRESQL para consistencia dev/prod
const postgresConfig = {
  client: 'pg',
  connection: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  } : {
    // Fallback a localhost si no hay DATABASE_URL (solo para desarrollo local)
    host: 'localhost',
    port: 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'rifaplus_dev'
  },
  migrations: {
    directory: './db/migrations'
  },
  seeds: {
    directory: './db/seeds'
  }
};

module.exports = {
  development: postgresConfig,
  production: postgresConfig
};
