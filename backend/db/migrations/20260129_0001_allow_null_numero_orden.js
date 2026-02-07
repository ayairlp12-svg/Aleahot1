/**
 * MIGRACIÓN: Permitir NULL en numero_orden (prerequisito)
 * 
 * Antes de unificar a NULL, hay que permitir NULL en la columna
 */

exports.up = async (knex) => {
    console.log('🔄 [Migración] Modificando columna numero_orden para permitir NULL...');
    
    try {
        // Modificar orden_oportunidades
        await knex.raw(`
            ALTER TABLE orden_oportunidades
            ALTER COLUMN numero_orden DROP NOT NULL;
        `);
        console.log('   ✅ orden_oportunidades.numero_orden ahora permite NULL');

        // Modificar boletos_estado
        await knex.raw(`
            ALTER TABLE boletos_estado
            ALTER COLUMN numero_orden DROP NOT NULL;
        `);
        console.log('   ✅ boletos_estado.numero_orden ahora permite NULL');

        console.log('✅ Columnas modificadas exitosamente');
    } catch (error) {
        console.error('❌ Error modificando columnas:', error.message);
        throw error;
    }
};

exports.down = async (knex) => {
    console.log('🔄 [Migración] Revirtiendo cambios (NOT NULL)...');
    
    try {
        // Primero asegurar que no hay NULL
        await knex('orden_oportunidades')
            .whereNull('numero_orden')
            .update({ numero_orden: '0' });

        await knex('boletos_estado')
            .whereNull('numero_orden')
            .update({ numero_orden: '0' });

        // Revertir a NOT NULL
        await knex.raw(`
            ALTER TABLE orden_oportunidades
            ALTER COLUMN numero_orden SET NOT NULL;
        `);

        await knex.raw(`
            ALTER TABLE boletos_estado
            ALTER COLUMN numero_orden SET NOT NULL;
        `);
        
        console.log('✅ Revertido a NOT NULL');
    } catch (error) {
        console.error('❌ Error revirtiendo:', error.message);
        throw error;
    }
};
