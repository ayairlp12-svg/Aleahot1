const db = require('./db');

/**
 * Devuelve un query builder que busca órdenes que contienen el número de boleto
 * Asume PostgreSQL: convierte la columna JSON/JSONB a text y usa LIKE.
 * @param {Number|String} numeroBoleto
 * @returns {Knex.QueryBuilder}
 */
function ordersContainingBoletoQuery(numeroBoleto) {
  const n = Number(numeroBoleto);
  if (isNaN(n)) throw new Error('Número de boleto inválido');

  // Cast JSONB/JSON a text y buscar coincidencia exacta del número
  // usando límites no numéricos para evitar falsos positivos:
  // 12 NO debe coincidir con 112, 120 o 9123.
  const patron = `(^|[^0-9])${n}([^0-9]|$)`;
  return db('ordenes').whereRaw("CAST(boletos AS text) ~ ?", [patron]);
}

module.exports = {
  ordersContainingBoletoQuery
};
