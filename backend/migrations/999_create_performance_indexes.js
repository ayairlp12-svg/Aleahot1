/**
 * Migración para crear índices de rendimiento
 * Optimiza las queries lentas al máximo
 */

exports.up = async function(knex) {
    try {
        console.log('📊 [Migration] Creando índices de rendimiento...');

        // Índices para boletos_estado
        await knex.schema.withSchema('public').table('boletos_estado', (table) => {
            // Índice compuesto para búsquedas por estado
            table.index('estado', 'idx_boletos_estado_estado');
            
            // Índice para orden_id si existe
            if (table._knex.schema._container.lastBuilder && 
                table._knex.schema._container.lastBuilder._statements.some(s => s.column === 'orden_id')) {
                table.index('orden_id', 'idx_boletos_estado_orden_id');
            }
            
            // Índice compuesto para estado + numero (muy común)
            table.index(['estado', 'numero'], 'idx_boletos_estado_numero');
        }).catch(() => {
            console.log('⚠️  Tabla boletos_estado ya tiene los índices o no existe');
        });

        // Índices para orden_oportunidades
        await knex.schema.withSchema('public').table('orden_oportunidades', (table) => {
            // Índice por estado (usado en conteos)
            table.index('estado', 'idx_oportunidades_estado');
            
            // Índice compuesto para estado + numero_oportunidad
            table.index(['estado', 'numero_oportunidad'], 'idx_oportunidades_estado_numero');
            
            // Índice por orden_id si existe
            table.index('orden_id', 'idx_oportunidades_orden_id');
        }).catch(() => {
            console.log('⚠️  Tabla orden_oportunidades ya tiene los índices');
        });

        // Índices para ordenes
        await knex.schema.withSchema('public').table('ordenes', (table) => {
            // Índice por estado (usado en expiración)
            table.index('estado', 'idx_ordenes_estado');
            
            // Índice compuesto para estado + fecha (usado en limpieza de expiración)
            table.index(['estado', 'created_at'], 'idx_ordenes_estado_fecha');
            
            // Índice por fecha de creación
            table.index('created_at', 'idx_ordenes_created_at');
        }).catch(() => {
            console.log('⚠️  Tabla ordenes ya tiene los índices');
        });

        console.log('✅ Índices de rendimiento creados exitosamente');

        // Crear índices a bajo nivel si lo anterior falla
        try {
            await knex.raw(`
                CREATE INDEX IF NOT EXISTS idx_boletos_estado_estado 
                ON boletos_estado(estado) 
                WHERE estado IN ('vendido', 'apartado')
            `);
            
            await knex.raw(`
                CREATE INDEX IF NOT EXISTS idx_oportunidades_estado 
                ON orden_oportunidades(estado) 
                WHERE estado = 'reservado'
            `);
            
            await knex.raw(`
                CREATE INDEX IF NOT EXISTS idx_ordenes_estado_fecha 
                ON ordenes(estado, created_at) 
                WHERE estado = 'pendiente'
            `);

            console.log('✅ Índices particionados creados');
        } catch (e) {
            console.log('⚠️  Índices particionados ya existen');
        }

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        throw error;
    }
};

exports.down = async function(knex) {
    try {
        console.log('🔄 [Migration] Eliminando índices...');

        // Eliminar índices de forma segura
        const indexes = [
            'idx_boletos_estado_estado',
            'idx_boletos_estado_numero',
            'idx_oportunidades_estado',
            'idx_oportunidades_estado_numero',
            'idx_oportunidades_orden_id',
            'idx_ordenes_estado',
            'idx_ordenes_estado_fecha',
            'idx_ordenes_created_at'
        ];

        for (const idx of indexes) {
            try {
                await knex.raw(`DROP INDEX IF EXISTS ${idx}`);
            } catch (e) {
                // Ignorar errores de índices que no existen
            }
        }

        console.log('✅ Índices eliminados');
    } catch (error) {
        console.error('❌ Error al eliminar índices:', error.message);
    }
};
