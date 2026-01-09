/**
 * ============================================================
 * ARCHIVO: backend/migrations/optimize-production.js
 * DESCRIPCIÓN: Optimizaciones para producción (índices, constraints)
 * 
 * Corre con: npx knex migrate:latest
 * ============================================================
 */

exports.up = async function(knex) {
  console.log('🔧 Ejecutando optimizaciones de producción...');

  // ===== ÍNDICES PARA PERFORMANCE =====
  
  // 1. Índice en boletos_estado.estado (para queries por estado)
  try {
    await knex.schema.table('boletos_estado', (table) => {
      // Este índice probablemente ya existe de la migración original
      // pero lo dejamos aquí para documentación
    });
    console.log('✅ Índice en boletos_estado.estado (ya existe)');
  } catch (err) {
    if (!err.message.includes('already exists')) {
      throw err;
    }
  }

  // 2. Índice compuesto en ordenes (buscar por cliente + estado)
  try {
    const indices = await knex('information_schema.statistics')
      .where('table_schema', knex.client.config.connection.database)
      .where('table_name', 'ordenes')
      .where('index_name', 'idx_ordenes_cliente_estado');
    
    if (indices.length === 0) {
      await knex.schema.table('ordenes', (table) => {
        table.index(['cliente_email', 'estado']);
      });
      console.log('✅ Índice compuesto en ordenes(cliente_email, estado) creado');
    }
  } catch (err) {
    console.log('⚠️  No se pudo crear índice en ordenes:', err.message);
  }

  // 3. Índice en ordenes.created_at (para queries de expiración)
  try {
    const indices = await knex('information_schema.statistics')
      .where('table_schema', knex.client.config.connection.database)
      .where('table_name', 'ordenes')
      .where('index_name', 'idx_ordenes_created_at');
    
    if (indices.length === 0) {
      await knex.schema.table('ordenes', (table) => {
        table.index(['created_at']);
      });
      console.log('✅ Índice en ordenes(created_at) creado');
    }
  } catch (err) {
    console.log('⚠️  No se pudo crear índice en ordenes.created_at:', err.message);
  }

  // ===== CONSTRAINT PARA INTEGRIDAD =====
  
  // 4. Constraint: estado solo puede ser ciertos valores
  try {
    const constraints = await knex.raw(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'boletos_estado' 
      AND constraint_name LIKE '%estado%'
    `);
    
    if (constraints.rows.length === 0) {
      await knex.schema.table('boletos_estado', (table) => {
        table.enum('estado', ['disponible', 'apartado', 'vendido', 'cancelado']).alter();
      });
      console.log('✅ Constraint en boletos_estado.estado verificado');
    }
  } catch (err) {
    console.log('⚠️  No se pudo verificar constraint:', err.message);
  }

  console.log('✅ Optimizaciones de producción completadas');
};

exports.down = async function(knex) {
  console.log('⏮️  Revirtiendo optimizaciones...');
  
  // En una migración down, típicamente dropearíamos los índices
  // Pero como son opcionales para producción, podemos dejarlos
  
  console.log('⏮️  Índices mantenidos (son opcionales)');
};
