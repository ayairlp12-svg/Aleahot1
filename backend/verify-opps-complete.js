const db = require('./db');

(async () => {
  try {
    console.log('🔍 VERIFICACIÓN COMPLETA DE OPORTUNIDADES\n');
    console.log('═'.repeat(60));

    // 1. CONTAR TOTAL DE REGISTROS
    console.log('\n1️⃣ CONTEO TOTAL');
    const total = await db('orden_oportunidades').count('* as cnt').first();
    const totalNum = parseInt(total.cnt);
    console.log(`   Total registros: ${totalNum}`);
    console.log(`   Esperado: 750,000`);
    console.log(`   ${totalNum === 750000 ? '✅ OK' : '❌ ERROR'}`);

    // 2. CONTAR POR RANGO
    console.log('\n2️⃣ RANGO 250,000 - 999,999');
    const enRango = await db('orden_oportunidades')
      .whereBetween('numero_oportunidad', [250000, 999999])
      .count('* as cnt')
      .first();
    const enRangoNum = parseInt(enRango.cnt);
    console.log(`   En rango: ${enRangoNum}`);
    console.log(`   ${enRangoNum === 750000 ? '✅ OK' : '❌ ERROR'}`);

    // 3. VERIFICAR NÚMEROS DUPLICADOS
    console.log('\n3️⃣ DUPLICADOS');
    const duplicados = await db.raw(`
      SELECT numero_oportunidad, COUNT(*) as cnt
      FROM orden_oportunidades
      GROUP BY numero_oportunidad
      HAVING COUNT(*) > 1
    `);
    console.log(`   Duplicados encontrados: ${duplicados.rows.length}`);
    if (duplicados.rows.length > 0) {
      console.log('   ❌ ERROR - Hay duplicados:');
      duplicados.rows.slice(0, 5).forEach(row => {
        console.log(`      Número ${row.numero_oportunidad}: ${row.cnt} veces`);
      });
    } else {
      console.log(`   ✅ OK - Sin duplicados`);
    }

    // 4. VERIFICAR NÚMEROS FUERA DE RANGO
    console.log('\n4️⃣ NÚMEROS FUERA DE RANGO');
    const fuera = await db('orden_oportunidades')
      .where(db.raw('numero_oportunidad < 250000 OR numero_oportunidad > 999999'))
      .count('* as cnt')
      .first();
    const fueraNum = parseInt(fuera.cnt);
    console.log(`   Fuera de rango: ${fueraNum}`);
    console.log(`   ${fueraNum === 0 ? '✅ OK' : '❌ ERROR'}`);

    // 5. VERIFICAR NÚMEROS HUÉRFANOS (estado apartado sin número_orden)
    console.log('\n5️⃣ NÚMEROS HUÉRFANOS');
    const huerfanos = await db('orden_oportunidades')
      .where('estado', 'apartado')
      .whereNull('numero_orden')
      .count('* as cnt')
      .first();
    const huerfanosNum = parseInt(huerfanos.cnt);
    console.log(`   Apartados sin número_orden: ${huerfanosNum}`);
    console.log(`   ${huerfanosNum === 0 ? '✅ OK' : '❌ ERROR'}`);

    if (huerfanos.cnt > 0) {
      const nums = await db('orden_oportunidades')
        .where('estado', 'apartado')
        .whereNull('numero_orden')
        .pluck('numero_oportunidad')
        .limit(10);
      console.log(`   Primeros 10: [${nums.join(', ')}]`);
    }

    // 6. VERIFICAR NÚMEROS ASIGNADOS A ÓRDENES NO EXISTENTES
    console.log('\n6️⃣ REFERENCIAS ROTAS A ÓRDENES');
    const referenciasRotas = await db('orden_oportunidades')
      .whereNotNull('numero_orden')
      .whereNotIn('numero_orden', 
        db('ordenes').select('numero_orden')
      )
      .count('* as cnt')
      .first();
    const referenciasRotasNum = parseInt(referenciasRotas.cnt);
    console.log(`   Oportunidades con orden inexistente: ${referenciasRotasNum}`);
    console.log(`   ${referenciasRotasNum === 0 ? '✅ OK' : '❌ ERROR'}`);

    // 7. VERIFICAR HUECOS EN SECUENCIA
    console.log('\n7️⃣ HUECOS EN SECUENCIA (250k-999k)');
    console.log('   Buscando huecos (esto toma un momento)...');
    
    const todos = await db('orden_oportunidades')
      .whereBetween('numero_oportunidad', [250000, 999999])
      .pluck('numero_oportunidad');
    
    const todosSet = new Set(todos);
    const huecos = [];
    
    for (let i = 250000; i <= 999999; i++) {
      if (!todosSet.has(i)) {
        huecos.push(i);
      }
    }
    
    console.log(`   Huecos encontrados: ${huecos.length}`);
    if (huecos.length > 0) {
      console.log(`   ❌ ERROR - Números faltantes:`);
      console.log(`   [${huecos.join(', ')}]`);
    } else {
      console.log(`   ✅ OK - Secuencia completa sin huecos`);
    }

    // RESUMEN
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN:');
    
    const checksOK = [
      totalNum === 750000,
      enRangoNum === 750000,
      duplicados.rows.length === 0,
      fueraNum === 0,
      huerfanosNum === 0,
      referenciasRotasNum === 0,
      huecos.length === 0
    ];
    
    const okCount = checksOK.filter(x => x).length;
    console.log(`   ✅ Checks pasados: ${okCount}/7`);
    
    if (okCount === 7) {
      console.log('\n✨ SISTEMA VERIFICADO Y CORRECTO');
      console.log('   - 750,000 oportunidades\n   - Sin duplicados\n   - Sin huecos\n   - Sin huérfanos');
    } else {
      console.log('\n⚠️ PROBLEMAS DETECTADOS');
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
