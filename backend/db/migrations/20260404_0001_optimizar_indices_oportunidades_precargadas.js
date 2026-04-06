/**
 * MIGRACIÓN: Optimizar índices de orden_oportunidades para el modelo precargado
 *
 * Contexto:
 * - Antes las oportunidades se resolvían "al vuelo" y se acumularon índices
 *   pensados para búsquedas dinámicas por estado/orden.
 * - Ahora cada oportunidad existe una sola vez, está ligada a un numero_boleto
 *   y solo cambia de estado/numero_orden durante el ciclo de la compra.
 *
 * Objetivo:
 * - Priorizar los accesos reales del sistema actual:
 *   1) numero_boleto -> oportunidades precargadas
 *   2) numero_boleto disponible -> apartar oportunidades de una orden
 *   3) numero_orden -> listar/liberar/confirmar oportunidades
 *   4) numero_oportunidad -> lookup directo/validación
 *   5) rango oculto disponible -> listar oportunidades libres
 *
 * Importante:
 * - Se usa transaction: false para poder crear/eliminar índices CONCURRENTLY.
 */

function normalizarDefinicion(definicion) {
  return String(definicion || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

async function obtenerDefinicionIndice(knex, nombre) {
  const resultado = await knex.raw(`
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = ?
  `, [nombre]);

  return resultado?.rows?.[0]?.indexdef || null;
}

async function eliminarIndiceSiExiste(knex, nombre) {
  await knex.raw(`DROP INDEX CONCURRENTLY IF EXISTS ${nombre}`);
}

async function crearIndice(knex, sql) {
  await knex.raw(sql);
}

exports.config = {
  transaction: false
};

exports.up = async function up(knex) {
  console.log('\n🔧 [Migración] Optimizando índices para oportunidades precargadas...\n');

  const existeTabla = await knex.schema.hasTable('orden_oportunidades');
  if (!existeTabla) {
    console.log('⏭️  Tabla orden_oportunidades no existe; se omite migración.\n');
    return;
  }

  const definicionDisponibles = normalizarDefinicion(await obtenerDefinicionIndice(knex, 'idx_opp_disponibles'));
  const definicionActivos = normalizarDefinicion(await obtenerDefinicionIndice(knex, 'idx_numero_opu_activo'));

  const idxDisponiblesEsModerno = definicionDisponibles.includes('orden_oportunidades')
    && definicionDisponibles.includes('(numero_oportunidad)')
    && definicionDisponibles.includes('estado')
    && definicionDisponibles.includes('disponible')
    && definicionDisponibles.includes('numero_orden is null');

  const idxActivosEsModerno = definicionActivos.includes('orden_oportunidades')
    && definicionActivos.includes('(numero_oportunidad)')
    && definicionActivos.includes('apartado')
    && definicionActivos.includes('vendido');

  if (definicionDisponibles && !idxDisponiblesEsModerno) {
    console.log('♻️  Reemplazando idx_opp_disponibles heredado por definición del modelo actual...');
    await eliminarIndiceSiExiste(knex, 'idx_opp_disponibles');
  }

  if (definicionActivos && !idxActivosEsModerno) {
    console.log('♻️  Reemplazando idx_numero_opu_activo heredado por definición del modelo actual...');
    await eliminarIndiceSiExiste(knex, 'idx_numero_opu_activo');
  }

  console.log('✅ Creando/asegurando índices útiles para el flujo actual...');

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_numero_oportunidad
    ON orden_oportunidades(numero_oportunidad)
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_numero_boleto_oportunidad
    ON orden_oportunidades(numero_boleto, numero_oportunidad)
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_numero_boleto_disponibles
    ON orden_oportunidades(numero_boleto)
    WHERE estado = 'disponible' AND numero_orden IS NULL
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_numero_orden_oportunidad
    ON orden_oportunidades(numero_orden, numero_oportunidad)
    WHERE numero_orden IS NOT NULL
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_disponibles
    ON orden_oportunidades(numero_oportunidad)
    WHERE estado = 'disponible' AND numero_orden IS NULL
  `);

  await crearIndice(knex, `
    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_numero_opu_activo
    ON orden_oportunidades(numero_oportunidad)
    WHERE estado IN ('apartado', 'vendido')
  `);

  console.log('🧹 Eliminando índices legacy o redundantes...');

  const indicesLegacy = [
    'idx_opp_estado',
    'idx_opp_estado_numero',
    'idx_opp_estado_numero_orden',
    'idx_opp_numero_boleto',
    'idx_opp_numero_optimizado',
    'idx_opp_numero_orden',
    'idx_opp_numero_orden_estado'
  ];

  for (const indice of indicesLegacy) {
    await eliminarIndiceSiExiste(knex, indice);
  }

  await knex.raw('ANALYZE orden_oportunidades');

  console.log('✅ Índices de orden_oportunidades alineados al modelo precargado.\n');
};

exports.down = async function down(knex) {
  console.log('\n↩️  [Migración] Revirtiendo optimización de índices de oportunidades...\n');

  const existeTabla = await knex.schema.hasTable('orden_oportunidades');
  if (!existeTabla) {
    console.log('⏭️  Tabla orden_oportunidades no existe; se omite rollback.\n');
    return;
  }

  const indicesModernos = [
    'idx_opp_numero_boleto_oportunidad',
    'idx_opp_numero_boleto_disponibles',
    'idx_opp_numero_orden_oportunidad'
  ];

  for (const indice of indicesModernos) {
    await eliminarIndiceSiExiste(knex, indice);
  }

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_numero_boleto
    ON orden_oportunidades(numero_boleto)
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_numero_orden
    ON orden_oportunidades(numero_orden)
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_estado_numero_orden
    ON orden_oportunidades(estado, numero_orden)
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_numero_orden_estado
    ON orden_oportunidades(numero_orden, estado)
  `);

  await crearIndice(knex, `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_disponibles
    ON orden_oportunidades(numero_orden)
    WHERE estado = 'disponible'
  `);

  await knex.raw('ANALYZE orden_oportunidades');

  console.log('✅ Rollback de índices completado.\n');
};
