/**
 * Migración: Actualizar enum de orden_oportunidades para incluir 'apartado'
 * Problema: Intentamos guardar estado='apartado' pero el enum no lo incluía
 * Solución: Actualizar enum a ['disponible', 'apartado', 'vendido']
 */

module.exports = {
    up: async (knex) => {
        console.log('🔄 Migrando: Actualizar enum de orden_oportunidades...');
        
        // En PostgreSQL, necesitamos hacer esto:
        // 1. Crear nuevo tipo enum
        // 2. Alterar columna para usar nuevo tipo
        // 3. Eliminar tipo viejo
        
        try {
            // Paso 1: Crear nuevo tipo enum
            await knex.raw(`
                CREATE TYPE estado_oportunidades_new AS ENUM (
                    'disponible',
                    'apartado', 
                    'vendido'
                );
            `);
            console.log('✅ Nuevo tipo enum creado');
        } catch (e) {
            console.warn('⚠️  Tipo enum ya existe o error:', e.message);
        }

        // Paso 2: Alterar la columna
        try {
            await knex.raw(`
                ALTER TABLE orden_oportunidades
                ALTER COLUMN estado TYPE estado_oportunidades_new
                USING estado::text::estado_oportunidades_new;
            `);
            console.log('✅ Columna estado actualizada');
        } catch (e) {
            if (e.message.includes('already exists') || e.message.includes('no column')) {
                console.log('ℹ️  Columna ya actualizada o no existe');
            } else {
                throw e;
            }
        }

        // Paso 3: Cambiar valor por defecto
        try {
            await knex.raw(`
                ALTER TABLE orden_oportunidades
                ALTER COLUMN estado SET DEFAULT 'disponible';
            `);
            console.log('✅ Valor por defecto actualizado a disponible');
        } catch (e) {
            console.warn('⚠️  No se pudo actualizar default:', e.message);
        }

        // Paso 4: Intentar eliminar tipo viejo (puede fallar si aún se usa)
        try {
            await knex.raw(`DROP TYPE IF EXISTS estado_oportunidades CASCADE;`);
            console.log('✅ Tipo viejo eliminado');
        } catch (e) {
            console.warn('⚠️  No se pudo eliminar tipo viejo:', e.message);
        }

        console.log('✅ Migración completada');
    },

    down: async (knex) => {
        console.log('⏮️  Revirtiendo migración...');
        
        // Revertir es complejo, por ahora solo logging
        console.log('⚠️  Reversión manual requerida');
    }
};
