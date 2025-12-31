/**
 * Migración: Eliminar columna `email_cliente` de la tabla `ordenes`
 * - Usa `dropColumn` directo en Postgres.
 *
 * IMPORTANTE: Probar esta migración primero en una copia de la BD antes
 * de ejecutarla en producción. Esta migración modifica la estructura
 * y copia los datos; aunque intenta ser segura, siempre haga respaldo.
 */

exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('ordenes', 'email_cliente');
  if (!exists) return;

  // En Postgres (y DB modernas) podemos eliminar la columna directamente.
  await knex.schema.table('ordenes', table => {
    table.dropColumn('email_cliente');
  });
};

exports.down = async function(knex) {
  // Restaurar columna `email_cliente` al hacer rollback
  await knex.schema.table('ordenes', table => {
    table.string('email_cliente', 255);
  });
};
