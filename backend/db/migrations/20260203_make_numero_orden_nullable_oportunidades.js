/**
 * Migration: Make numero_orden nullable in orden_oportunidades
 * 
 * Problema: La tabla tenía numero_orden NOT NULL, lo que impide tener
 * oportunidades "no asignadas" (disponibles) en la tabla.
 * 
 * Solución: Hacer nullable para que podamos guardar disponibles con NULL
 * y luego asignarlas atomicamente cuando se crea la orden.
 * 
 * Cambio de arquitectura:
 * ANTES: Oportunidades se creaban al pedir, se validaban existencia
 * DESPUÉS: Todas las oportunidades existen con numero_orden=NULL (disponibles)
 *          Al crear orden, se asignan atomicamente (UPDATE con WHERE)
 */

exports.up = async function(knex) {
    const exists = await knex.schema.hasTable('orden_oportunidades');
    if (!exists) {
        console.log('⚠️  Tabla orden_oportunidades no existe aún, skipping migration');
        return;
    }

    console.log('🔄 Migrando: Hacer numero_orden nullable en orden_oportunidades...');

    try {
        // Primero, cambiar el constraint exterior (FK)
        // En PostgreSQL, necesitamos:
        // 1. Remover la FK existente
        // 2. Permitir NULL
        // 3. Recrear la FK para permitir NULL

        // Paso 1: Remover FK (intentamos el nombre estándar que genera knex)
        try {
            await knex.raw(`
                ALTER TABLE orden_oportunidades 
                DROP CONSTRAINT orden_oportunidades_numero_orden_foreign;
            `);
            console.log('✅ FK removida');
        } catch (e) {
            console.log('⚠️  No se encontró FK estándar, intentando encontrar manualmente...');
            // Si falló, intentar con table_constraints
            const constraints = await knex.raw(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'orden_oportunidades' 
                AND constraint_type = 'FOREIGN KEY';
            `);
            
            if (constraints.rows?.length > 0) {
                const fkName = constraints.rows[0].constraint_name;
                await knex.raw(`ALTER TABLE orden_oportunidades DROP CONSTRAINT "${fkName}";`);
                console.log(`✅ FK "${fkName}" removida`);
            }
        }

        // Paso 2: Remover NOT NULL
        await knex.raw(`
            ALTER TABLE orden_oportunidades 
            ALTER COLUMN numero_orden DROP NOT NULL;
        `);
        console.log('✅ numero_orden ahora acepta NULL');

        // Paso 3: Recrear la FK permitiendo NULL
        // (Las FKs en PostgreSQL pueden apuntar a NULL sin problema)
        await knex.raw(`
            ALTER TABLE orden_oportunidades 
            ADD CONSTRAINT fk_orden_oportunidades_numero_orden
            FOREIGN KEY (numero_orden) 
            REFERENCES ordenes(numero_orden) 
            ON DELETE CASCADE;
        `);
        console.log('✅ FK recreada (ahora nullable)');

        // Paso 4: Actualizar UNIQUE constraint para permitir múltiples NULLs
        // En PostgreSQL, múltiples NULLs no violan UNIQUE, así que ya está bien
        
        console.log('✅ [Migration] Completada: numero_orden ahora es nullable');

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        throw error;
    }
};

exports.down = async function(knex) {
    console.log('🔄 Revertiendo: Hacer numero_orden NOT NULL...');

    try {
        // Remover la FK que creamos
        await knex.raw(`
            ALTER TABLE orden_oportunidades 
            DROP CONSTRAINT IF EXISTS fk_orden_oportunidades_numero_orden;
        `);

        // Establecer NOT NULL nuevamente
        await knex.raw(`
            ALTER TABLE orden_oportunidades 
            ALTER COLUMN numero_orden SET NOT NULL;
        `);

        // Recrear FK original
        await knex.raw(`
            ALTER TABLE orden_oportunidades 
            ADD CONSTRAINT fk_orden_oportunidades_numero_orden
            FOREIGN KEY (numero_orden) 
            REFERENCES ordenes(numero_orden) 
            ON DELETE CASCADE;
        `);

        console.log('✅ Revertida: numero_orden vuelto a NOT NULL');
    } catch (error) {
        console.error('❌ Error al revertir:', error.message);
        throw error;
    }
};
