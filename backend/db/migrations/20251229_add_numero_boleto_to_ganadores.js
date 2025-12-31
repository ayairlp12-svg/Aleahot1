exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('ganadores');
  if (!exists) return Promise.resolve();

  const hasCol = await knex.schema.hasColumn('ganadores', 'numero_boleto');
  if (!hasCol) {
    return knex.schema.table('ganadores', (table) => {
      table.string('numero_boleto', 50).nullable();
    });
  }
};

exports.down = async function(knex) {
  const hasCol = await knex.schema.hasColumn('ganadores', 'numero_boleto');
  if (hasCol) {
    return knex.schema.table('ganadores', (table) => {
      table.dropColumn('numero_boleto');
    });
  }
};
