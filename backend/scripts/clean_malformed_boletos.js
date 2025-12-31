#!/usr/bin/env node
// Script: backend/scripts/clean_malformed_boletos.js
// Busca órdenes con boletos malformados (JSON inválido) y las repara

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

(async function main(){
  try {
    console.log('🔍 Buscando órdenes con boletos malformados...\n');
    
    const rows = await knex('ordenes').select('id', 'numero_orden', 'boletos', 'estado');
    let fixed = [];
    let skipped = [];

    for (const r of rows) {
      let boletos = [];
      let isMalformed = false;

      try {
        boletos = JSON.parse(r.boletos || '[]');
        if (!Array.isArray(boletos)) {
          isMalformed = true;
          boletos = [];
        }
      } catch (e) {
        isMalformed = true;
        boletos = [];
      }

      if (isMalformed) {
        console.log(`❌ ${r.numero_orden} (${r.estado}): JSON inválido → arreglando...`);
        
        // Intentar extraer números válidos como fallback
        try {
          const numberMatches = (r.boletos || '').match(/\d+/g) || [];
          boletos = numberMatches.map(n => parseInt(n, 10)).filter(n => n > 0);
        } catch (e) {
          boletos = [];
        }

        // Guardar versión arreglada
        await knex('ordenes').where('id', r.id).update({
          boletos: JSON.stringify(boletos),
          updated_at: new Date().toISOString()
        });

        fixed.push({
          numero_orden: r.numero_orden,
          boletosCuenta: boletos.length,
          accion: 'ARREGLADO'
        });
      } else {
        skipped.push(r.numero_orden);
      }
    }

    console.log(`\n✅ LIMPIEZA COMPLETADA`);
    console.log(`   - Órdenes reparadas: ${fixed.length}`);
    console.log(`   - Órdenes OK: ${skipped.length}`);
    
    if (fixed.length > 0) {
      console.log(`\n📋 Detalles de reparaciones:`);
      fixed.forEach(f => {
        console.log(`   ✓ ${f.numero_orden}: ${f.boletosCuenta} boletos recuperados`);
      });
    }

    process.exit(0);
  } catch (e) {
    console.error('Error al ejecutar script:', e);
    process.exit(1);
  }
})();
