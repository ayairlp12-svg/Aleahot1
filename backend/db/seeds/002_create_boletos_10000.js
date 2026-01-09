/**
 * Seed: Crear 10,000 boletos para la rifa
 * Números del 0 al 9,999 (últimas 4 cifras de la lotería nacional)
 * Estado inicial: 'disponible'
 */

exports.seed = async function(knex) {
  // Limpiar tabla existente
  await knex('boletos_estado').del();

  // Generar array de boletos
  const boletos = [];
  for (let i = 0; i < 10000; i++) {
    boletos.push({
      numero: i,
      estado: 'disponible',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  }

  // Insertar en batch para mejor performance
  const batchSize = 500;
  for (let i = 0; i < boletos.length; i += batchSize) {
    await knex('boletos_estado').insert(boletos.slice(i, i + batchSize));
  }

  console.log(`✅ ${boletos.length} boletos creados exitosamente (0-9999)`);
};
