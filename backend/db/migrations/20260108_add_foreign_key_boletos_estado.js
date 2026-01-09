/**
 * MIGRACIÓN: Añadir constraint FOREIGN KEY en boletos_estado
 * 
 * PROBLEMA PREVIO:
 * - boletos_estado.numero_orden NO tenía integridad referencial con ordenes.numero_orden
 * - Podía haber boletos "apartados" sin orden correspondiente (boletos huérfanos)
 * - Dashboard mostraba conteos incorrectos
 * 
 * SOLUCIÓN:
 * - Añadir FOREIGN KEY constraint: boletos_estado.numero_orden → ordenes.numero_orden
 * - ON DELETE CASCADE: si se elimina una orden, sus boletos se limpian automáticamente
 * - ON UPDATE CASCADE: si cambia el numero_orden, se propaga el cambio
 * 
 * BENEFICIOS:
 * ✅ Imposible tener boletos huérfanos
 * ✅ Base de datos mantiene consistencia automáticamente
 * ✅ Dashboard siempre muestra conteos correctos
 * ✅ Race conditions controladas por PostgreSQL
 */

exports.up = async function(knex) {
  // Verificar si la constraint ya existe (en caso de re-run)
  const existingFK = await knex.raw(`
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'boletos_estado' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'boletos_estado_numero_orden_fk'
  `);

  if (existingFK.rows.length > 0) {
    console.log('ℹ️  Constraint FOREIGN KEY ya existe, omitiendo...');
    return;
  }

  // Limpiar boletos huérfanos antes de añadir constraint
  console.log('🧹 Limpiando boletos huérfanos...');
  const huerfanos = await knex('boletos_estado')
    .whereNotNull('numero_orden')
    .where('numero_orden', '!=', '')
    .whereRaw(`
      numero_orden NOT IN (
        SELECT numero_orden FROM ordenes WHERE numero_orden IS NOT NULL
      )
    `);

  if (huerfanos.length > 0) {
    console.log(`   Encontrados ${huerfanos.length} boletos huérfanos`);
    await knex('boletos_estado')
      .whereNotNull('numero_orden')
      .where('numero_orden', '!=', '')
      .whereRaw(`
        numero_orden NOT IN (
          SELECT numero_orden FROM ordenes WHERE numero_orden IS NOT NULL
        )
      `)
      .update({
        numero_orden: null,
        estado: 'disponible'
      });
    console.log('   ✅ Boletos huérfanos limpiados');
  }

  // Añadir FOREIGN KEY
  console.log('🔐 Añadiendo constraint FOREIGN KEY...');
  await knex.raw(`
    ALTER TABLE boletos_estado
    ADD CONSTRAINT boletos_estado_numero_orden_fk
    FOREIGN KEY (numero_orden)
    REFERENCES ordenes(numero_orden)
    ON DELETE CASCADE
    ON UPDATE CASCADE
  `);

  console.log('✅ Constraint FOREIGN KEY añadida correctamente');
};

exports.down = async function(knex) {
  // Remover la constraint si se revierte la migración
  console.log('🔄 Removiendo constraint FOREIGN KEY...');
  
  const existingFK = await knex.raw(`
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'boletos_estado' 
    AND constraint_name = 'boletos_estado_numero_orden_fk'
  `);

  if (existingFK.rows.length > 0) {
    await knex.raw(`
      ALTER TABLE boletos_estado
      DROP CONSTRAINT boletos_estado_numero_orden_fk
    `);
    console.log('✅ Constraint FOREIGN KEY removida');
  }
};
