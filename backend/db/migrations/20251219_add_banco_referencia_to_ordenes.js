exports.up = function(knex) {
  return knex.schema.table('ordenes', function(table) {
    table.string('nombre_banco', 100).nullable().after('nombre_beneficiario');
    table.string('numero_referencia', 100).nullable().after('nombre_banco');
  });
};

exports.down = function(knex) {
  return knex.schema.table('ordenes', function(table) {
    table.dropColumn('numero_referencia');
    table.dropColumn('nombre_banco');
  });
};
