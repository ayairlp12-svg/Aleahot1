require('dotenv').config();
const db = require('./db');
const dbUtils = require('./db-utils');

(async () => {
  try {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL ? 'yes' : 'no', ' NODE_ENV=', process.env.NODE_ENV);
    const rows = await db('ordenes')
      .whereIn('estado', ['pendiente', 'comprobante_recibido'])
      .select('id', 'numero_orden', 'estado', 'boletos', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(50);

    console.log('Found', rows.length, 'pending/comprobante orders');
    rows.forEach(r => {
      console.log(JSON.stringify({ id: r.id, numero_orden: r.numero_orden, estado: r.estado, created_at: r.created_at, boletos_preview: (r.boletos || '').slice(0,200) }));
    });

    // Also check for specific boleto 40 or 41 using DB-agnostic helper
    const rows40 = await dbUtils.ordersContainingBoletoQuery(40).select('id','numero_orden','estado','boletos','created_at').limit(50);
    const rows41 = await dbUtils.ordersContainingBoletoQuery(41).select('id','numero_orden','estado','boletos','created_at').limit(50);
    console.log('Orders containing 40:', rows40.length);
    rows40.forEach(r => console.log('  ', r.numero_orden, r.estado));
    console.log('Orders containing 41:', rows41.length);
    rows41.forEach(r => console.log('  ', r.numero_orden, r.estado));

    process.exit(0);
  } catch (e) {
    console.error('Error querying DB:', e.message || e);
    process.exit(2);
  }
})();