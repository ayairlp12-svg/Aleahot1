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

  // Cast JSONB/JSON a text y buscar coincidencia textual del número
  return db('ordenes').whereRaw("CAST(boletos AS text) LIKE ?", [`%${n}%`]);
}

module.exports = {
  ordersContainingBoletoQuery
};
