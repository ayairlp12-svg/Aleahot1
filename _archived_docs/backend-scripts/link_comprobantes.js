const fs = require('fs');
const path = require('path');
const db = require('../db');

(async () => {
  try {
    const carpeta = path.join(__dirname, '..', 'public', 'comprobantes');
    if (!fs.existsSync(carpeta)) {
      console.log('No existe carpeta de comprobantes:', carpeta);
      process.exit(0);
    }

    const files = fs.readdirSync(carpeta);
    let updated = 0;

    for (const f of files) {
      // Nombre esperado: <numero_orden>_<timestamp>.<ext>
      const match = f.match(/^(.+?)_\d+\.[a-zA-Z0-9]+$/);
      if (!match) continue;
      const numeroOrden = match[1];
      const rutaRelativa = `comprobantes/${f}`;

      // Actualizar solo si existe la orden y no tiene comprobante_path
      const orden = await db('ordenes').where('numero_orden', numeroOrden).first();
      if (orden && !orden.comprobante_path) {
        await db('ordenes')
          .where('numero_orden', numeroOrden)
          .update({ comprobante_path: rutaRelativa, comprobante_fecha: new Date(), updated_at: new Date() });
        console.log('Actualizada orden:', numeroOrden, '->', rutaRelativa);
        updated++;
      }
    }

    console.log(`Proceso finalizado. Órdenes actualizadas: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error('Error en script link_comprobantes:', err);
    process.exit(1);
  }
})();
