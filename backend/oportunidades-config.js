function parseEntero(valor) {
  const numero = Number.parseInt(valor, 10);
  return Number.isInteger(numero) ? numero : null;
}

function normalizarRangoNumerico(rango) {
  const inicio = parseEntero(rango?.inicio);
  const fin = parseEntero(rango?.fin);

  if (!Number.isInteger(inicio) || !Number.isInteger(fin) || inicio < 0 || fin < inicio) {
    return null;
  }

  return { inicio, fin };
}

function obtenerTamanoRango(rango) {
  if (!rango) return 0;
  return Math.max(0, (Number(rango.fin) - Number(rango.inicio)) + 1);
}

function rangosSeTraslapan(rangoA, rangoB) {
  if (!rangoA || !rangoB) return false;
  return Number(rangoA.inicio) <= Number(rangoB.fin)
    && Number(rangoB.inicio) <= Number(rangoA.fin);
}

function resolverConfigOportunidades(configBase = null, options = {}) {
  const config = configBase || {};
  const rifa = config?.rifa || {};
  const oportunidades = rifa.oportunidades || {};
  const overrides = options.overrides || {};

  const totalBoletos = parseEntero(rifa.totalBoletos ?? config.totalBoletos) || 0;
  const enabled = options.enabledOverride === undefined
    ? oportunidades.enabled === true
    : options.enabledOverride === true;
  const validarComoActivas = options.validarComoActivas === undefined
    ? enabled
    : options.validarComoActivas === true;

  const multiplicador = parseEntero(overrides.multiplicador ?? oportunidades.multiplicador);

  let rangoVisible = normalizarRangoNumerico(overrides.rangoVisible ?? oportunidades.rango_visible);
  if (
    !rangoVisible
    && options.permitirFallbackVisible === true
    && totalBoletos > 0
    && !validarComoActivas
  ) {
    rangoVisible = { inicio: 0, fin: totalBoletos - 1 };
  }

  let rangoOculto = normalizarRangoNumerico(overrides.rangoOculto ?? oportunidades.rango_oculto);
  if (
    !rangoOculto
    && options.permitirDerivarOculto === true
    && rangoVisible
    && Number.isInteger(multiplicador)
    && multiplicador > 0
  ) {
    const inicio = Number(rangoVisible.fin) + 1;
    rangoOculto = {
      inicio,
      fin: inicio + (obtenerTamanoRango(rangoVisible) * multiplicador) - 1
    };
  }

  const totalBoletosVisibles = rangoVisible ? obtenerTamanoRango(rangoVisible) : 0;
  const totalOportunidadesEsperadas = Number.isInteger(multiplicador) && multiplicador > 0
    ? totalBoletosVisibles * multiplicador
    : 0;
  const totalOportunidadesConfiguradas = rangoOculto
    ? obtenerTamanoRango(rangoOculto)
    : 0;

  const errores = [];

  if (validarComoActivas) {
    if (!(totalBoletos > 0)) {
      errores.push('Debes configurar un total de boletos mayor a 0');
    }

    if (!Number.isInteger(multiplicador) || multiplicador < 1) {
      errores.push('El multiplicador de oportunidades debe ser un entero mayor a 0');
    }

    if (!rangoVisible) {
      errores.push('Debes definir un rango visible de oportunidades válido');
    }

    if (!rangoOculto) {
      errores.push('Debes definir un rango oculto de oportunidades válido');
    }

    if (rangoVisible && totalBoletos > 0 && (rangoVisible.inicio !== 0 || rangoVisible.fin !== totalBoletos - 1)) {
      errores.push(`El rango visible debe ser exactamente 0 - ${Math.max(0, totalBoletos - 1)}`);
    }

    if (rangoVisible && rangoOculto && rangosSeTraslapan(rangoVisible, rangoOculto)) {
      errores.push('El rango oculto no puede traslaparse con el rango visible');
    }

    if (
      rangoOculto
      && Number.isInteger(multiplicador)
      && multiplicador > 0
      && totalOportunidadesConfiguradas !== totalOportunidadesEsperadas
    ) {
      errores.push(
        `El rango oculto debe contener exactamente ${totalOportunidadesEsperadas.toLocaleString()} oportunidades (${totalBoletosVisibles.toLocaleString()} boletos x ${multiplicador})`
      );
    }
  }

  const configuracionCompleta = !validarComoActivas || Boolean(
    totalBoletos > 0
    && Number.isInteger(multiplicador)
    && multiplicador > 0
    && rangoVisible
    && rangoOculto
  );

  return {
    enabled,
    multiplicador: Number.isInteger(multiplicador) && multiplicador > 0 ? multiplicador : 0,
    rangoVisible,
    rangoOculto,
    totalBoletos,
    totalBoletosVisibles,
    totalOportunidadesEsperadas,
    totalOportunidadesConfiguradas,
    configuracionCompleta,
    configuracionConsistente: configuracionCompleta && errores.length === 0,
    errores
  };
}

module.exports = {
  normalizarRangoNumerico,
  obtenerTamanoRango,
  resolverConfigOportunidades
};
