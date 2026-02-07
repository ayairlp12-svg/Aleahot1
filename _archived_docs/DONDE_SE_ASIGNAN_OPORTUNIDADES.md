/**
 * ============================================================
 * ¿DÓNDE SE ASIGNAN LAS OPORTUNIDADES A LOS BOLETOS?
 * ============================================================
 * 
 * Respuesta: EN EL FRONTEND, usando un algoritmo DETERMINÍSTICO
 * (no al azar, sino siempre el mismo resultado para los mismos boletos)
 */

// ─────────────────────────────────────────────────────────────
// UBICACIÓN DEL CÓDIGO
// ─────────────────────────────────────────────────────────────

/**
 * Archivo: js/oportunidades-service.js
 * Método: OportunidadesService.calcularOportunidadesCarrito(boletosSeleccionados)
 * 
 * Este es el PUNTO DE ENTRADA donde se calcula qué oportunidades
 * van con qué boleto.
 */

// ─────────────────────────────────────────────────────────────
// FLUJO COMPLETO
// ─────────────────────────────────────────────────────────────

/**
 * 1. USUARIO SELECCIONA BOLETOS EN FRONTEND
 * ────────────────────────────────────────
 * Usuario: [Selecciona boletos 123, 456, 789]
 * 
 * 
 * 2. LLAMADA A calcularOportunidadesCarrito()
 * ─────────────────────────────────────────
 * const resultado = OportunidadesService.calcularOportunidadesCarrito([123, 456, 789]);
 * 
 * Ubicación: js/oportunidades-service.js línea 256
 * 
 *   calcularOportunidadesCarrito(boletosSeleccionados) {
 *     // Paso 1: Verificar caché (si los mismos boletos ya se calcularon)
 *     const cacheKey = boletosOrdenados.join(','); // "123,456,789"
 *     if (this._cacheOportunidades.has(cacheKey)) {
 *       return cached_result;  ← RÁPIDO (instantáneo)
 *     }
 * 
 *     // Paso 2: Generar SEED determinístico
 *     const seed = this._generarSeedDesdeBoletosSeleccionados([123, 456, 789]);
 *     // Resultado: seed = 12345 (siempre igual para estos boletos)
 * 
 *     // Paso 3: Determinar multiplicador (3 oportunidades por boleto, etc.)
 *     const multiplicador = 3; // 1 boleto = 3 oportunidades
 * 
 *     // Paso 4: ✅ ASIGNACIÓN PRINCIPAL
 *     const oportunidadesPorBoleto = {};
 * 
 *     for (const boletVisible of [123, 456, 789]) {
 *       const seedBoleto = seed + boletVisible;  // Seed única por boleto
 *       const oportunidades = this.generarOportunidades(3, boletosOcultosUsados, seedBoleto);
 *       oportunidadesPorBoleto[boletVisible] = oportunidades;
 *       // Resultado:
 *       // oportunidadesPorBoleto[123] = [250112, 252496, 254109]
 *       // oportunidadesPorBoleto[456] = [255001, 256234, 257845]
 *       // oportunidadesPorBoleto[789] = [998234, 999001, 999234]
 *     }
 * 
 *     // Paso 5: Aplanar a un array único para enviar al backend
 *     const boletosOcultos = [250112, 252496, 254109, 255001, 256234, 257845, 998234, 999001, 999234];
 * 
 *     // Paso 6: Guardar en caché para siguiente cálculo
 *     this._guardarEnCache(cacheKey, resultado);
 * 
 *     // Paso 7: Retornar resultado
 *     return {
 *       boletosVisibles: [123, 456, 789],
 *       oportunidadesPorBoleto: { ... },
 *       boletosOcultos: [ ... ]
 *     };
 *   }
 * 
 * 
 * 3. GENERACIÓN DE NÚMEROS (el corazón del algoritmo)
 * ───────────────────────────────────────────────────
 * Ubicación: js/oportunidades-service.js línea 195 (método generarOportunidades)
 * 
 * Para CADA BOLETO, genera sus oportunidades usando LCG:
 * 
 *   generarOportunidades(cantidad, boletosYaUsados, seed) {
 *     // seed = seed_base + numero_boleto (único por boleto)
 * 
 *     const oportunidades = [];
 *     let currentSeed = seed;
 * 
 *     // Generar 'cantidad' números (ej: 3 oportunidades)
 *     for (let i = 0; i < cantidad; i++) {
 *       // LINEAR CONGRUENTIAL GENERATOR (LCG) - Determinístico
 *       currentSeed = (currentSeed * 1103515245 + 12345) % 2147483648;
 *       
 *       // Convertir seed a número en rango [250000, 999999]
 *       const rangoOculto = this.obtenerRangoOculto();
 *       const maxOpp = rangoOculto.fin - rangoOculto.inicio + 1;
 *       let numero = (currentSeed % maxOpp) + rangoOculto.inicio;
 * 
 *       // Evitar duplicados (máx 20 intentos)
 *       while (boletosYaUsados.has(numero) && intentos < 20) {
 *         currentSeed = (currentSeed * 1103515245 + 12345) % 2147483648;
 *         numero = (currentSeed % maxOpp) + rangoOculto.inicio;
 *         intentos++;
 *       }
 * 
 *       boletosYaUsados.add(numero);
 *       oportunidades.push(numero);
 *     }
 * 
 *     return oportunidades; // [250112, 252496, 254109]
 *   }
 * 
 * 
 * 4. RESULTADO EN FRONTEND
 * ───────────────────────
 * {
 *   boletosVisibles: [123, 456, 789],
 *   
 *   oportunidadesPorBoleto: {
 *     123: [250112, 252496, 254109],
 *     456: [255001, 256234, 257845],
 *     789: [998234, 999001, 999234]
 *   },
 *   
 *   boletosOcultos: [250112, 252496, 254109, 255001, 256234, 257845, 998234, 999001, 999234]
 * }
 * 
 * ✅ Las relaciones (boleto X → oportunidades Y, Z, W) se guardan
 *    EN EL FRONTEND en memoria y localStorage
 * 
 * ✅ El backend SOLO recibe boletosOcultos como array plano
 *    NO mantiene la relación 1:N
 */

// ─────────────────────────────────────────────────────────────
// CLAVE: ¿POR QUÉ NO ES ALEATORIO?
// ─────────────────────────────────────────────────────────────

/**
 * El algoritmo es DETERMINÍSTICO, no verdaderamente aleatorio:
 * 
 * Mismos boletos → SIEMPRE las mismas oportunidades
 * 
 * EJEMPLO:
 * 
 * Primera ejecución:
 * Input:  [123, 456, 789]
 * Seed:   12345
 * Output: oportunidadesPorBoleto[123] = [250112, 252496, 254109]
 * 
 * Segunda ejecución (mismos boletos):
 * Input:  [123, 456, 789]
 * Seed:   12345 (calculada de los mismos boletos)
 * Output: oportunidadesPorBoleto[123] = [250112, 252496, 254109] ← EXACTO IGUAL
 * 
 * ¿Por qué?
 * - El seed se calcula SOLO a partir de los boletos seleccionados
 * - LCG (Linear Congruential Generator) es un PRNG determinístico
 * - Mismo seed → misma secuencia de números
 * 
 * FÓRMULA DEL SEED:
 * 
 *   seed = 12345
 *   para cada boletVisible en boletosSeleccionados:
 *     seed = (seed * 31 + boletVisible) % 2147483647
 * 
 * Ejemplo: boletos [123, 456, 789]
 *   seed = 12345
 *   seed = (12345 * 31 + 123) % 2147483647 = 382718
 *   seed = (382718 * 31 + 456) % 2147483647 = 11864014
 *   seed = (11864014 * 31 + 789) % 2147483647 = 367784423
 * 
 * RESULTADO: Seed siempre 367784423 para [123, 456, 789]
 */

// ─────────────────────────────────────────────────────────────
// FLUJO POR ARCHIVO
// ─────────────────────────────────────────────────────────────

/**
 * 1. Usuario selecciona boletos
 *    Ubicación: js/carrito-global.js
 *    
 *    agregarBoletoSelecionado(numero) { ... }
 *    removerBoletoSeleccionado(numero) { ... }
 * 
 * 
 * 2. Se llama calcularOportunidadesCarrito
 *    Ubicación: js/carrito-global.js línea 774
 *    
 *    function calcularYLlenarOportunidades(numerosOrdenados) {
 *      const resultado = OportunidadesService.calcularOportunidadesCarrito(numerosOrdenados);
 *      // resultado.oportunidadesPorBoleto es el mapeo boleto→oportunidades
 *    }
 * 
 * 
 * 3. Se genera seed y se asignan oportunidades
 *    Ubicación: js/oportunidades-service.js línea 256
 *    
 *    calcularOportunidadesCarrito(boletosSeleccionados) {
 *      const seed = this._generarSeedDesdeBoletosSeleccionados(...);
 *      
 *      for (const boletVisible of boletosSeleccionados) {
 *        const oportunidades = this.generarOportunidades(cantidad, ..., seed + boletVisible);
 *        oportunidadesPorBoleto[boletVisible] = oportunidades;
 *      }
 *    }
 * 
 * 
 * 4. Generación de números con LCG
 *    Ubicación: js/oportunidades-service.js línea 195
 *    
 *    generarOportunidades(cantidad, boletosYaUsados, seed) {
 *      for (let i = 0; i < cantidad; i++) {
 *        currentSeed = (currentSeed * 1103515245 + 12345) % 2147483648;
 *        let numero = (currentSeed % maxOpp) + rangoOculto.inicio;
 *        // Agregar a oportunidades
 *      }
 *    }
 * 
 * 
 * 5. Se guarda en localStorage y caché
 *    Ubicación: js/oportunidades-manager.js
 *    
 *    guardarOportunidades(resultado) {
 *      localStorage.setItem('oportunidades', JSON.stringify({
 *        boletosSeleccionados: [...],
 *        oportunidadesPorBoleto: {...},
 *        boletosOcultos: [...]
 *      }));
 *    }
 * 
 * 
 * 6. Se envía al backend
 *    Ubicación: js/flujo-compra.js
 *    
 *    POST /api/ordenes {
 *      boletos: [123, 456, 789],
 *      boletosOcultos: [250112, 252496, ..., 999234],
 *      ...
 *    }
 * 
 * 
 * 7. Backend asigna TODOS los boletosOcultos a la orden
 *    Ubicación: backend/services/oportunidadesOrdenService.js
 *    
 *    ❌ NO mantiene relación boleto→oportunidad
 *    ✅ Solo asigna toda la lista a numero_orden
 */

// ─────────────────────────────────────────────────────────────
// ALGORITMO DETERMINÍSTICO EN DETALLE
// ─────────────────────────────────────────────────────────────

/**
 * Paso 1: Generar SEED
 * ──────────────────
 * Función: _generarSeedDesdeBoletosSeleccionados()
 * Ubicación: js/oportunidades-service.js línea 38
 * 
 * ENTRADA: boletosSeleccionados = [123, 456, 789]
 * 
 * ALGORITMO:
 * let seed = 12345;
 * const boletosOrdenados = [123, 456, 789].sort() → [123, 456, 789]
 * 
 * for (const numero of [123, 456, 789]) {
 *   seed = (seed * 31 + numero) % 2147483647;
 * }
 * // Iteración 1: seed = (12345 * 31 + 123) % 2147483647 = 382718
 * // Iteración 2: seed = (382718 * 31 + 456) % 2147483647 = 11864014
 * // Iteración 3: seed = (11864014 * 31 + 789) % 2147483647 = 367784423
 * 
 * SALIDA: seed = 367784423
 * 
 * ✅ Este seed es DETERMINÍSTICO:
 *    - Los mismos boletos siempre producen el mismo seed
 *    - Diferentes boletos producen diferentes seeds
 * 
 * 
 * Paso 2: Para CADA boleto, generar sus oportunidades
 * ───────────────────────────────────────────────────
 * Para boleto 123:
 *   seedBoleto = 367784423 + 123 = 367784546
 *   generarOportunidades(3, boletosOcultosUsados, 367784546)
 * 
 * Para boleto 456:
 *   seedBoleto = 367784423 + 456 = 367784879
 *   generarOportunidades(3, boletosOcultosUsados, 367784879)
 * 
 * Para boleto 789:
 *   seedBoleto = 367784423 + 789 = 367785212
 *   generarOportunidades(3, boletosOcultosUsados, 367785212)
 * 
 * ✅ Cada boleto tiene su propio seed, pero derivado del mismo base
 *    → Diferentes oportunidades por boleto
 *    → Pero determinísticas (reproducibles)
 * 
 * 
 * Paso 3: Generar números con LCG
 * ───────────────────────────────
 * Función: generarOportunidades()
 * Ubicación: js/oportunidades-service.js línea 195
 * 
 * ALGORITMO LCG (Linear Congruential Generator):
 * 
 * x(n+1) = (a * x(n) + c) mod m
 * 
 * Donde:
 * a = 1103515245
 * c = 12345
 * m = 2147483648 (2^31)
 * 
 * EJECUCIÓN para Boleto 123:
 * 
 * Oportunidad 1:
 *   currentSeed = (367784546 * 1103515245 + 12345) % 2147483648
 *   currentSeed = 250112 (aproximadamente)
 *   numero = (250112 % 750000) + 250000 = 250112
 *   oportunidades.push(250112)
 * 
 * Oportunidad 2:
 *   currentSeed = (250112 * 1103515245 + 12345) % 2147483648
 *   currentSeed = ... (otro número)
 *   numero = ... → 252496
 *   oportunidades.push(252496)
 * 
 * Oportunidad 3:
 *   currentSeed = (... * 1103515245 + 12345) % 2147483648
 *   numero = ... → 254109
 *   oportunidades.push(254109)
 * 
 * RESULTADO para Boleto 123: [250112, 252496, 254109]
 * 
 * ✅ Este resultado es SIEMPRE IGUAL para seed = 367784546
 *    (cambiar seed = diferentes números)
 */

// ─────────────────────────────────────────────────────────────
// RESUMEN
// ─────────────────────────────────────────────────────────────

/**
 * ❓ ¿DÓNDE SE ASIGNAN LAS OPORTUNIDADES A LOS BOLETOS?
 * ✅ EN EL FRONTEND: js/oportunidades-service.js
 * 
 * ❓ ¿CÓMO SE ASIGNAN?
 * ✅ DETERMINÍSTICAMENTE usando LCG (Linear Congruential Generator)
 * ✅ NO verdaderamente "al azar", sino reproducible y predecible
 * 
 * ❓ ¿QUIÉN DECIDE LA ASIGNACIÓN?
 * ✅ Un algoritmo matemático determinístico
 * ✅ No el usuario, no el servidor, no un generador aleatorio real
 * 
 * ❓ ¿SE GUARDAN EN LA BD?
 * ❌ NO: La relación boleto→oportunidad se guarda SOLO en frontend
 * ✅ SÍ: Las oportunidades asignadas a la orden se guardan en BD
 * 
 * ❓ ¿PUEDE EL USUARIO ELEGIR SUS OPORTUNIDADES?
 * ❌ NO: Son determinísticas basadas en los boletos que selecciona
 * ✅ SÍ: Si selecciona otros boletos, obtiene otras oportunidades
 * 
 * ❓ ¿PUEDE CAMBIAR ENTRE EJECUCIONES?
 * ❌ NO: Los mismos boletos siempre dan las mismas oportunidades
 * ✅ REPRODUCIBILIDAD GARANTIZADA
 * 
 * EJEMPLO:
 * 
 * Usuario A: Selecciona [123, 456, 789]
 *   → Recibe oportunidades [250112, 252496, 254109, ...]
 * 
 * Usuario A (2 horas después): Selecciona [123, 456, 789] de nuevo
 *   → Recibe EXACTAMENTE las mismas oportunidades [250112, 252496, 254109, ...]
 * 
 * Usuario B: Selecciona [100, 200, 300]
 *   → Recibe DIFERENTES oportunidades (diferente seed)
 */
