/**
 * Migración: Hacer email_cliente opcional
 * El email no es requerido en el formulario de contacto
 */

exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('ordenes', 'email_cliente');
  if (!exists) return;

  return knex.schema.alterTable('ordenes', table => {
    table.string('email_cliente', 255).nullable().alter();
  });
};

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('ordenes', 'email_cliente');
  if (!exists) return;

  return knex.schema.alterTable('ordenes', table => {
    table.string('email_cliente', 255).notNullable().alter();
  });
};
