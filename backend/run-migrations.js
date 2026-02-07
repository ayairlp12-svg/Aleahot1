#!/usr/bin/env node
/**
 * Script para ejecutar migraciones manualmente con mejor logging
 */

const knex = require('knex');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

const config = {
    client: 'pg',
    connection: process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    } : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'rifaplus_dev'
    },
    migrations: {
        directory: path.join(__dirname, 'db/migrations'),
        extension: 'js'
    }
};

console.log('📊 Configuración de conexión:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SÍ (Render)' : 'NO (localhost)');
console.log('   NODE_ENV:', process.env.NODE_ENV);

const db = knex(config);

async function runMigrations() {
    try {
        console.log('\n🔄 Probando conexión a la BD...');
        await db.raw('SELECT 1');
        console.log('✅ Conexión exitosa\n');

        console.log('📦 Ejecutando migraciones...');
        const result = await db.migrate.latest();
        
        console.log('\n✅ Migraciones completadas:');
        result.forEach((file, idx) => {
            console.log(`   ${idx + 1}. ${file}`);
        });
        
        console.log('\n✅ Todas las migraciones se ejecutaron correctamente');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nDetalles:', error);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

runMigrations();
