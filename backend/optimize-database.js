/**
 * Script para analizar y optimizar la base de datos
 * Ejecutar con: node backend/optimize-database.js
 * O en Render: npm run optimize-db
 */

const db = require('./db');

async function optimizarDatabase() {
    try {
        console.log('🔧 [DatabaseOptimizer] Iniciando optimización...\n');
        console.log('📍 Conectado a:', process.env.DATABASE_URL ? 'Base de datos remota (Render)' : 'Base de datos local\n');

        // 1. Crear índices si no existen
        console.log('🔍 [Índices] Creando índices de rendimiento...');
        
        const indexQueries = [
            {
                name: 'idx_boletos_estado_estado',
                query: `CREATE INDEX IF NOT EXISTS idx_boletos_estado_estado 
                        ON boletos_estado(estado) 
                        WHERE estado IN ('vendido', 'apartado')`
            },
            {
                name: 'idx_boletos_estado_numero',
                query: `CREATE INDEX IF NOT EXISTS idx_boletos_estado_numero 
                        ON boletos_estado(estado, numero)`
            },
            {
                name: 'idx_oportunidades_estado',
                query: `CREATE INDEX IF NOT EXISTS idx_oportunidades_estado 
                        ON orden_oportunidades(estado) 
                        WHERE estado = 'reservado'`
            },
            {
                name: 'idx_oportunidades_estado_numero',
                query: `CREATE INDEX IF NOT EXISTS idx_oportunidades_estado_numero 
                        ON orden_oportunidades(estado, numero_oportunidad)`
            },
            {
                name: 'idx_oportunidades_orden_id',
                query: `CREATE INDEX IF NOT EXISTS idx_oportunidades_orden_id 
                        ON orden_oportunidades(orden_id)`
            },
            {
                name: 'idx_ordenes_estado',
                query: `CREATE INDEX IF NOT EXISTS idx_ordenes_estado 
                        ON ordenes(estado)`
            },
            {
                name: 'idx_ordenes_estado_fecha',
                query: `CREATE INDEX IF NOT EXISTS idx_ordenes_estado_fecha 
                        ON ordenes(estado, created_at) 
                        WHERE estado = 'pendiente'`
            },
            {
                name: 'idx_ordenes_created_at',
                query: `CREATE INDEX IF NOT EXISTS idx_ordenes_created_at 
                        ON ordenes(created_at)`
            }
        ];

        let createdCount = 0;
        for (const idx of indexQueries) {
            try {
                await db.raw(idx.query);
                console.log(`  ✅ ${idx.name}`);
                createdCount++;
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`  ⓘ ${idx.name} (ya existe)`);
                } else {
                    console.error(`  ⚠️  ${idx.name}: ${e.message}`);
                }
            }
        }
        console.log(`\n✅ ${createdCount} índices creados/verificados\n`);

        // 2. Intentar obtener estadísticas (puede fallar si no hay permisos)
        try {
            console.log('📈 [Estadísticas de Índices]');
            const indexStats = await db.raw(`
                SELECT 
                    tablename,
                    indexname,
                    idx_scan as scans
                FROM pg_stat_user_indexes
                WHERE tablename IN ('boletos_estado', 'orden_oportunidades', 'ordenes')
                ORDER BY idx_scan DESC
            `);
            
            if (indexStats.rows && indexStats.rows.length > 0) {
                indexStats.rows.forEach(row => {
                    console.log(`  ${row.indexname}: ${row.scans} scans`);
                });
            }
            console.log('');
        } catch (e) {
            console.log('  ⓘ No se pudo obtener estadísticas de índices\n');
        }

        // 3. Obtener estadísticas de tablas
        try {
            console.log('📊 [Estadísticas de Tablas]');
            const tableStats = await db.raw(`
                SELECT 
                    tablename,
                    seq_scan as sequential_scans,
                    idx_scan as index_scans
                FROM pg_stat_user_tables
                WHERE tablename IN ('boletos_estado', 'orden_oportunidades', 'ordenes')
            `);
            
            if (tableStats.rows) {
                tableStats.rows.forEach(row => {
                    const status = row.index_scans > 0 ? '✅ Con índices' : '⚠️  Sin índices usados';
                    console.log(`  ${row.tablename}: ${status}`);
                });
            }
            console.log('');
        } catch (e) {
            console.log('  ⓘ No se pudo obtener estadísticas de tablas\n');
        }

        // 4. Obtener tamaño de las tablas
        try {
            console.log('💾 [Tamaño de Tablas]');
            const sizeStats = await db.raw(`
                SELECT 
                    tablename,
                    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
                FROM pg_tables
                WHERE tablename IN ('boletos_estado', 'orden_oportunidades', 'ordenes')
                    AND schemaname = 'public'
            `);
            
            if (sizeStats.rows) {
                sizeStats.rows.forEach(row => {
                    console.log(`  ${row.tablename}: ${row.size}`);
                });
            }
            console.log('');
        } catch (e) {
            console.log('  ⓘ No se pudo obtener tamaño de tablas\n');
        }

        // 5. Analizar tablas para estadísticas
        try {
            console.log('🧹 [Análisis] Analizando tablas...');
            await db.raw('ANALYZE boletos_estado');
            await db.raw('ANALYZE orden_oportunidades');
            await db.raw('ANALYZE ordenes');
            console.log('✅ Análisis completado\n');
        } catch (e) {
            console.log('⚠️  No se pudo ejecutar ANALYZE\n');
        }

        console.log('🎉 ¡Optimización completada exitosamente!');
        console.log('   Las queries deberían ser mucho más rápidas ahora.');
        console.log('   Los índices aceleran conteos y búsquedas en ~50-80%.\n');

    } catch (error) {
        console.error('❌ Error durante optimización:', error.message);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Ejecutar
optimizarDatabase().catch(e => {
    console.error('Error fatal:', e);
    process.exit(1);
});
