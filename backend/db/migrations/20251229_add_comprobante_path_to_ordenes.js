exports.up = function(knex) {
  return knex.schema.hasTable('ordenes').then(exists => {
    if (!exists) return;
    return knex.schema.table('ordenes', function(t) {
      // Guardar ruta relativa al directorio /public
      t.string('comprobante_path');
      t.timestamp('comprobante_fecha');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('ordenes').then(exists => {
    if (!exists) return;
    return knex.schema.table('ordenes', function(t) {
      t.dropColumn('comprobante_path');
      t.dropColumn('comprobante_fecha');
    });
  });
};
