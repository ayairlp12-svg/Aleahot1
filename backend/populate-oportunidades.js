#!/usr/bin/env node

require('dotenv').config();

const db = require('./db');
const ConfigManagerV2 = require('./config-manager-v2');
const { resolverConfigOportunidades } = require('./oportunidades-config');

function parseArgs(argv) {
  const flags = new Set();
  const values = {};

  argv.forEach((arg) => {
    if (!arg.startsWith('--')) return;
    const [rawKey, rawValue] = arg.slice(2).split('=');
    const key = String(rawKey || '').trim();
    if (!key) return;

    if (rawValue === undefined) {
      flags.add(key);
      return;
    }

    values[key] = rawValue;
  });

  return { flags, values };
}

function barajarEnSitio(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function cargarConfigActiva() {
  const manager = new ConfigManagerV2(db);
  await manager.inicializar();
  return manager.getConfig();
}

function resolverConfigPoblado(config, args) {
  const overrideVisible = (
    args.values['visible-start'] !== undefined
    || args.values['visible-end'] !== undefined
  )
    ? {
      inicio: args.values['visible-start'],
      fin: args.values['visible-end']
    }
    : undefined;

  const overrideOculto = (
    args.values['hidden-start'] !== undefined
    || args.values['hidden-end'] !== undefined
  )
    ? {
      inicio: args.values['hidden-start'],
      fin: args.values['hidden-end']
    }
    : undefined;

  const resolved = resolverConfigOportunidades(config, {
    validarComoActivas: true,
    overrides: {
      multiplicador: args.values.multiplicador,
      rangoVisible: overrideVisible,
      rangoOculto: overrideOculto
    }
  });

  if (!resolved.configuracionConsistente) {
    throw new Error(resolved.errores.join(' | '));
  }

  return {
    totalBoletos: resolved.totalBoletos,
    multiplicador: resolved.multiplicador,
    rangoVisible: resolved.rangoVisible,
    rangoOculto: resolved.rangoOculto,
    totalVisibles: resolved.totalBoletosVisibles,
    totalOcultas: resolved.totalOportunidadesConfiguradas,
    totalEsperado: resolved.totalOportunidadesEsperadas
  };
}

async function obtenerBoletosVisibles(rangoVisible, totalEsperado) {
  const boletos = await db('boletos_estado')
    .whereBetween('numero', [rangoVisible.inicio, rangoVisible.fin])
    .select('numero')
    .orderBy('numero', 'asc');

  if (boletos.length !== totalEsperado) {
    throw new Error(
      `La tabla boletos_estado contiene ${boletos.length.toLocaleString()} boletos en el rango visible, pero se esperaban ${totalEsperado.toLocaleString()}`
    );
  }

  const numeros = boletos.map((row) => Number(row.numero));
  const faltantes = [];

  for (let numero = rangoVisible.inicio; numero <= rangoVisible.fin; numero += 1) {
    if (numeros[numero - rangoVisible.inicio] !== numero) {
      faltantes.push(numero);
      if (faltantes.length >= 10) break;
    }
  }

  if (faltantes.length > 0) {
    throw new Error(`Faltan boletos visibles en la BD. Ejemplos: ${faltantes.join(', ')}`);
  }

  return numeros;
}

function construirOportunidades(rangoOculto) {
  const numeros = [];
  for (let numero = rangoOculto.inicio; numero <= rangoOculto.fin; numero += 1) {
    numeros.push(numero);
  }
  return numeros;
}

function construirAsignaciones(boletosVisibles, oportunidadesOcultas, multiplicador, shuffle) {
  const pool = shuffle ? barajarEnSitio(oportunidadesOcultas) : [...oportunidadesOcultas];
  const asignaciones = [];
  let cursor = 0;

  boletosVisibles.forEach((numeroBoleto) => {
    for (let i = 0; i < multiplicador; i += 1) {
      const numeroOportunidad = pool[cursor];
      if (!Number.isInteger(numeroOportunidad)) {
        throw new Error(`No hay suficientes oportunidades para asignar al boleto ${numeroBoleto}`);
      }

      asignaciones.push({
        numero_oportunidad: numeroOportunidad,
        numero_boleto: numeroBoleto,
        estado: 'disponible',
        numero_orden: null
      });
      cursor += 1;
    }
  });

  return asignaciones;
}

async function validarEstadoPrevio(force) {
  const totalActual = await db('orden_oportunidades').count('* as total').first();
  const total = Number.parseInt(totalActual?.total, 10) || 0;

  if (total === 0) {
    return;
  }

  if (!force) {
    throw new Error(
      `La tabla orden_oportunidades ya contiene ${total.toLocaleString()} registros. Usa --force si quieres recrearla.`
    );
  }

  const asignadas = await db('orden_oportunidades')
    .whereNotNull('numero_orden')
    .count('* as total')
    .first();

  const totalAsignadas = Number.parseInt(asignadas?.total, 10) || 0;
  if (totalAsignadas > 0) {
    console.warn(`⚠️  Se encontraron ${totalAsignadas.toLocaleString()} oportunidades ya asignadas a órdenes.`);
  }
}

async function insertarAsignaciones(asignaciones, force) {
  const BATCH_SIZE = 10000;

  await db.transaction(async (trx) => {
    if (force) {
      await trx('orden_oportunidades').del();
    }

    for (let inicio = 0; inicio < asignaciones.length; inicio += BATCH_SIZE) {
      const batch = asignaciones.slice(inicio, inicio + BATCH_SIZE);
      await trx('orden_oportunidades').insert(batch);
      const fin = Math.min(inicio + batch.length, asignaciones.length);
      console.log(`   • Insertadas ${fin.toLocaleString()}/${asignaciones.length.toLocaleString()} oportunidades`);
    }
  });
}

async function validarAsignacionesFinales(totalEsperado, multiplicador) {
  const [conteoTotal, distinctOpps, porBoleto] = await Promise.all([
    db('orden_oportunidades').count('* as total').first(),
    db('orden_oportunidades').countDistinct('numero_oportunidad as total').first(),
    db('orden_oportunidades')
      .select('numero_boleto')
      .count('* as total')
      .groupBy('numero_boleto')
  ]);

  const total = Number.parseInt(conteoTotal?.total, 10) || 0;
  const totalDistinct = Number.parseInt(distinctOpps?.total, 10) || 0;

  if (total !== totalEsperado) {
    throw new Error(`Validación final falló: se esperaban ${totalEsperado} filas y quedaron ${total}`);
  }

  if (totalDistinct !== totalEsperado) {
    throw new Error(`Validación final falló: se esperaban ${totalEsperado} oportunidades únicas y quedaron ${totalDistinct}`);
  }

  const inconsistentes = porBoleto
    .map((row) => ({
      numero_boleto: Number(row.numero_boleto),
      total: Number.parseInt(row.total, 10) || 0
    }))
    .filter((row) => row.total !== multiplicador);

  if (inconsistentes.length > 0) {
    const ejemplos = inconsistentes.slice(0, 10).map((row) => `${row.numero_boleto}:${row.total}`).join(', ');
    throw new Error(`Validación final falló: boletos con cantidad incorrecta de oportunidades (${ejemplos})`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args.flags.has('dry-run');
  const force = args.flags.has('force');
  const shuffle = !args.flags.has('no-shuffle');

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  POBLAR OPORTUNIDADES PREASIGNADAS                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const config = await cargarConfigActiva();
  const resolved = resolverConfigPoblado(config, args);

  console.log('Configuración resuelta:');
  console.log(` • Rango visible: ${resolved.rangoVisible.inicio} - ${resolved.rangoVisible.fin}`);
  console.log(` • Rango oculto: ${resolved.rangoOculto.inicio} - ${resolved.rangoOculto.fin}`);
  console.log(` • Multiplicador: ${resolved.multiplicador}`);
  console.log(` • Total boletos visibles: ${resolved.totalVisibles.toLocaleString()}`);
  console.log(` • Total oportunidades esperadas: ${resolved.totalEsperado.toLocaleString()}`);
  console.log(` • Mezcla aleatoria: ${shuffle ? 'sí' : 'no'}`);
  console.log(` • Force recreate: ${force ? 'sí' : 'no'}`);
  console.log(` • Dry run: ${dryRun ? 'sí' : 'no'}\n`);

  await validarEstadoPrevio(force);

  const boletosVisibles = await obtenerBoletosVisibles(resolved.rangoVisible, resolved.totalVisibles);
  const oportunidadesOcultas = construirOportunidades(resolved.rangoOculto);
  const asignaciones = construirAsignaciones(
    boletosVisibles,
    oportunidadesOcultas,
    resolved.multiplicador,
    shuffle
  );

  console.log(`Asignaciones generadas: ${asignaciones.length.toLocaleString()}`);
  console.log(`Ejemplo boleto inicial: ${boletosVisibles[0]} → ${asignaciones.filter((row) => row.numero_boleto === boletosVisibles[0]).map((row) => row.numero_oportunidad).join(', ')}\n`);

  if (dryRun) {
    console.log('✅ Dry run completado. No se escribió nada en la base de datos.\n');
    return;
  }

  await insertarAsignaciones(asignaciones, force);
  await validarAsignacionesFinales(resolved.totalEsperado, resolved.multiplicador);

  console.log('\n✅ Oportunidades pobladas correctamente.');
  console.log(`   Total filas: ${resolved.totalEsperado.toLocaleString()}`);
  console.log(`   Relación final: ${resolved.multiplicador} oportunidades por boleto\n`);
}

main()
  .catch((error) => {
    console.error('\n❌ Error poblando oportunidades:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await db.destroy();
    } catch (error) {
      // noop
    }
  });
