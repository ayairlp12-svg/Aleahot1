#!/usr/bin/env node
// Script: backend/scripts/fix_inconsistent_orders.js
// Busca órdenes con descuentos negativos o totales inconsistentes y las corrige.

const Knex = require('knex');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL no está definido en .env — abortando.');
  process.exit(1);
}

const knex = Knex({
  client: 'pg',
  connection: DATABASE_URL,
  pool: { min: 0, max: 7 }
});

// Copiar la lógica de promociones del backend
const fs = require('fs');
const cfgPath = path.join(__dirname, '..', 'js', 'config.js');
function loadPromos() {
  try {
    const code = fs.readFileSync(cfgPath, 'utf8');
    const promosMatch = code.match(/promociones\s*:\s*\[([\s\S]*?)\]/);
    if (promosMatch && promosMatch[1]) {
      const inner = promosMatch[1];
      const objMatches = inner.match(/\{[^}]*\}/g) || [];
      const parsed = objMatches.map(s => {
        const cMatch = s.match(/cantidad\s*:\s*([0-9]+)/);
        const pMatch = s.match(/precio\s*:\s*([0-9]+)/);
        return {
          cantidad: cMatch ? parseInt(cMatch[1], 10) : 0,
          precio: pMatch ? parseInt(pMatch[1], 10) : 0
        };
      }).filter(p => p.cantidad > 0 && p.precio > 0);
      if (parsed.length) return parsed.sort((a,b)=>b.cantidad-a.cantidad);
    }
  } catch (e) {
    console.warn('No se pudo leer promociones, usando fallback');
  }
  return [{cantidad:20,precio:250},{cantidad:10,precio:130}];
}

const PROMOS = loadPromos();

function recalcularDescuento(cantidad, precioUnitario) {
  let rest = cantidad;
  let descuento = 0;
  for (const promo of PROMOS) {
    if (rest >= promo.cantidad) {
      const n = Math.floor(rest / promo.cantidad);
      const ahorro = promo.cantidad * precioUnitario - promo.precio;
      if (ahorro > 0) {
        descuento += n * ahorro;
        rest -= n * promo.cantidad;
      }
    }
  }
  return descuento;
}

(async function main(){
  try {
    console.log('Buscando órdenes inconsistentes...');
    const rows = await knex('ordenes').select('id','numero_orden','cantidad_boletos','precio_unitario','subtotal','descuento','total');
    let fixes = [];
    for (const r of rows) {
      const cantidad = parseInt(r.cantidad_boletos) || 0;
      const precio = parseFloat(r.precio_unitario) || (r.subtotal && cantidad>0 ? parseFloat(r.subtotal)/cantidad : 0);
      const subtotal = cantidad * precio;
      const descuentoRecalc = recalcularDescuento(cantidad, precio);
      const totalRecalc = parseFloat((subtotal - descuentoRecalc).toFixed(2));

      const totalStored = parseFloat(r.total) || 0;
      const descuentoStored = parseFloat(r.descuento) || 0;

      // Detectar inconsistencia: total != subtotal - descuento OR descuento < 0
      if (Math.abs(totalStored - totalRecalc) > 0.01 || descuentoStored < 0) {
        fixes.push({id: r.id, numero_orden: r.numero_orden, old_total: totalStored, old_descuento: descuentoStored, new_total: totalRecalc, new_descuento: descuentoRecalc});
      }
    }

    console.log('Órdenes a corregir:', fixes.length);
    for (const f of fixes) {
      console.log('Corrigiendo', f.numero_orden, '=>', f.old_total, '->', f.new_total);
      await knex('ordenes').where('id', f.id).update({
        subtotal: parseFloat((f.new_total + f.new_descuento).toFixed(2)),
        descuento: parseFloat(f.new_descuento.toFixed(2)),
        total: parseFloat(f.new_total.toFixed(2)),
        updated_at: new Date().toISOString()
      });
    }

    console.log('Correcciones completadas. Filas actualizadas:', fixes.length);
    process.exit(0);
  } catch (e) {
    console.error('Error al ejecutar script:', e);
    process.exit(1);
  }
})();
