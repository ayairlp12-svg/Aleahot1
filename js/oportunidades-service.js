/**
 * ============================================================
 * ARCHIVO: js/oportunidades-service.js
 * DESCRIPCIÓN: Servicio de Oportunidades (boletos ocultos)
 * Genera números aleatorios sin repetición para boletos extras
 * ============================================================
 */

const OportunidadesService = {
    /**
     * Calcula los rangos visibles basado en mostrarRangos
     * @returns {Array} Array de rangos activos
     */
    obtenerRangosVisibles() {
        const config = window.rifaplusConfig?.rifa;
        if (!config || !config.rangos) return [];

        // Si mostrarRangos es null, usar todos
        if (config.oportunidades?.mostrarRangos === null) {
            return config.rangos;
        }

        // Si está especificado, filtrar solo esos
        const idsSeleccionados = config.oportunidades?.mostrarRangos || [];
        return config.rangos.filter(rango => idsSeleccionados.includes(rango.id));
    },

    /**
     * Calcula el rango de boletos ocultos (no visibles)
     * Lee directamente de config.rifa.oportunidades.rango_oculto
     * @returns {Object} { inicio, fin, cantidad }
     */
    obtenerRangoOculto() {
        const config = window.rifaplusConfig?.rifa;
        
        // 🔑 LEER DIRECTAMENTE DE LA CONFIG
        if (config?.oportunidades?.rango_oculto) {
            const rangoOculto = config.oportunidades.rango_oculto;
            const cantidad = rangoOculto.fin - rangoOculto.inicio + 1;
            
            console.log('🔓 [OportunidadesService] Rango oculto desde config:', {
                inicio: rangoOculto.inicio,
                fin: rangoOculto.fin,
                cantidad: cantidad
            });
            
            return {
                inicio: rangoOculto.inicio,
                fin: rangoOculto.fin,
                cantidad: cantidad
            };
        }

        // FALLBACK: Si no está en config, intentar calcular (legacy)
        const rangosVisibles = this.obtenerRangosVisibles();

        if (!config || !rangosVisibles.length) {
            console.warn('⚠️ [OportunidadesService] Rango oculto no configurado y no hay rangos visibles');
            return { inicio: 0, fin: 0, cantidad: 0 };
        }

        // Encontrar el último boleto visible
        const ultimoVisible = Math.max(...rangosVisibles.map(r => r.fin));
        const primerOculto = ultimoVisible + 1;
        const ultimoOculto = config.totalBoletos - 1;

        return {
            inicio: primerOculto,
            fin: ultimoOculto,
            cantidad: ultimoOculto - primerOculto + 1
        };
    },

    /**
     * Cuenta total de boletos visibles
     * @returns {number} Total de boletos visibles
     */
    contarBoletosVisibles() {
        const rangosVisibles = this.obtenerRangosVisibles();
        return rangosVisibles.reduce((sum, rango) => {
            return sum + (rango.fin - rango.inicio + 1);
        }, 0);
    },

    /**
     * Verifica si un boleto está en el rango visible
     * @param {number} numero - Número de boleto
     * @returns {boolean} true si está visible
     */
    esBoletoBisible(numero) {
        const rangosVisibles = this.obtenerRangosVisibles();
        return rangosVisibles.some(rango => numero >= rango.inicio && numero <= rango.fin);
    },

    /**
     * Genera oportunidades (boletos ocultos) aleatorios sin repetición
     * @param {number} cantidad - Cuántas oportunidades generar
     * @param {Set} boletosYaUsados - Conjunto de boletos ya asignados (para evitar repetición global)
     * @returns {Array} Array de números aleatorios del rango oculto
     */
    generarOportunidades(cantidad, boletosYaUsados = new Set()) {
        const rangoOculto = this.obtenerRangoOculto();
        const oportunidades = [];

        console.log('%c🎁 [generarOportunidades] INICIANDO', 'color: #FF9800; font-weight: bold; font-size: 12px');
        console.log('  ✓ Cantidad requerida:', cantidad);
        console.log('  ✓ Rango oculto:', rangoOculto);
        console.log('  ✓ Boletos ya usados en este carrito:', boletosYaUsados.size);

        if (rangoOculto.cantidad <= 0 || cantidad <= 0) {
            console.warn('  ❌ Rango oculto vacío o cantidad 0');
            return oportunidades;
        }

        // Obtener boletos que NO están disponibles (vendidos + apartados)
        const boletosVendidos = window.rifaplusSoldNumbers || [];
        const boletosApartados = window.rifaplusReservedNumbers || [];
        const boletosNoDisponibles = new Set([...boletosVendidos, ...boletosApartados]);

        // Si no tenemos datos de boletos vendidos/apartados, usaremos el rango entero
        // (esto es seguro porque solo genera números del rango oculto que no fueron usados)
        const tieneDataSegura = (boletosVendidos.length > 0 || boletosApartados.length > 0);

        console.log('  ✓ Boletos vendidos:', boletosVendidos.length);
        console.log('  ✓ Boletos apartados:', boletosApartados.length);
        console.log('  ✓ ¿Tiene data segura?:', tieneDataSegura);

        // Crear array de números disponibles
        let disponibles = [];
        for (let i = rangoOculto.inicio; i <= rangoOculto.fin; i++) {
            // Solo incluir si:
            // 1. No fue usado en este carrito (boletosYaUsados)
            // 2. No está vendido o apartado en el backend (si tenemos esa data)
            if (!boletosYaUsados.has(i)) {
                if (tieneDataSegura) {
                    if (!boletosNoDisponibles.has(i)) {
                        disponibles.push(i);
                    }
                } else {
                    // Si no tenemos data, igual lo incluimos (es del rango oculto)
                    disponibles.push(i);
                }
            }
        }

        console.log('  ✓ Números disponibles generados:', disponibles.length);
        if (disponibles.length > 0 && disponibles.length <= 20) {
            console.log('  ✓ Primeros disponibles:', disponibles.slice(0, 20));
        }

        // Si no hay suficientes números disponibles, devolver lo que hay
        if (disponibles.length < cantidad) {
            console.warn(`  ⚠️ Solo ${disponibles.length} boletos ocultos disponibles, se solicitaron ${cantidad}`);
            return disponibles;
        }

        // Seleccionar N números aleatorios sin repetición
        // Algoritmo: Fisher-Yates shuffle y tomar los primeros N
        for (let i = 0; i < cantidad; i++) {
            const indexAleatorio = Math.floor(Math.random() * (disponibles.length - i));
            const numeroSeleccionado = disponibles[indexAleatorio];
            
            // Swap: poner el seleccionado al final para no volver a seleccionar
            [disponibles[indexAleatorio], disponibles[disponibles.length - 1 - i]] = 
            [disponibles[disponibles.length - 1 - i], disponibles[indexAleatorio]];
            
            oportunidades.push(numeroSeleccionado);
        }

        console.log('  ✓ Oportunidades generadas:', oportunidades);
        console.log('%c🎁 [generarOportunidades] FIN', 'color: #FF9800; font-weight: bold; font-size: 12px');

        return oportunidades;
    },

    /**
     * Calcula oportunidades para un carrito completo
     * Cada boleto visible genera sus propias oportunidades basado en condiciones dinámicas
     * @param {Array} boletosSeleccionados - Array de números de boletos visibles
     * @returns {Object} { boletosVisibles, oportunidadesPorBoleto, boletosOcultos (flat) }
     */
    calcularOportunidadesCarrito(boletosSeleccionados) {
        const config = window.rifaplusConfig?.rifa;
        if (!config?.oportunidades?.enabled) {
            return {
                boletosVisibles: boletosSeleccionados,
                oportunidadesPorBoleto: {},
                boletosOcultos: []
            };
        }

        // 🔑 DETERMINAR MULTIPLICADOR basado en condiciones dinámicas
        let multiplicador = 1; // Default a 1 si no hay condiciones
        const cantidadBoletos = boletosSeleccionados.length;
        
        if (config.oportunidades.tipo === 'dinamico' && config.oportunidades.condiciones_dinamicas) {
            // Buscar la condición que aplique a esta cantidad
            const condicion = config.oportunidades.condiciones_dinamicas.find(c => 
                cantidadBoletos >= c.cantidad_boletos_minima && 
                cantidadBoletos <= c.cantidad_boletos_maxima
            );
            
            if (condicion) {
                multiplicador = condicion.oportunidades_por_boleto;
            }
        } else if (config.oportunidades.tipo === 'fijo') {
            // Si es fijo, usar el mismo número para todos
            multiplicador = config.oportunidades.oportunidades_fijas || 1;
        }
        
        if (window.DEBUG_OPORTUNIDADES) {
            console.debug(`🎁 Oportunidades: ${cantidadBoletos} boletos × ${multiplicador} oportunidades = ${cantidadBoletos * multiplicador} total`);
        }

        const oportunidadesPorBoleto = {};
        const boletosOcultosUsados = new Set();

        // Para cada boleto visible, generar sus oportunidades
        for (const boletVisible of boletosSeleccionados) {
            const oportunidades = this.generarOportunidades(multiplicador, boletosOcultosUsados);
            oportunidadesPorBoleto[boletVisible] = oportunidades;
            
            // Agregar a usados para siguiente iteración
            oportunidades.forEach(o => boletosOcultosUsados.add(o));
        }

        // Aplanar todas las oportunidades en un array
        const boletosOcultos = Object.values(oportunidadesPorBoleto).flat();

        return {
            boletosVisibles: boletosSeleccionados,
            oportunidadesPorBoleto, // { 123: [456, 789, 1011], 124: [1012, 1013, 1014] }
            boletosOcultos // [456, 789, 1011, 1012, 1013, 1014]
        };
    },

    /**
     * Formato para mostrar en carrito
     * "Boleto 1234 - Oportunidades: 5678, 9012, 3456"
     * @param {number} boletVisible - Número del boleto visible
     * @param {Array} oportunidades - Array de oportunidades
     * @returns {string} Texto formateado
     */
    formatearParaCarrito(boletVisible, oportunidades) {
        if (!oportunidades || oportunidades.length === 0) {
            return `Boleto ${boletVisible}`;
        }
        
        const opuntidadesStr = oportunidades.join(', ');
        return `Boleto ${boletVisible} - Oportunidades: ${opuntidadesStr}`;
    },

    /**
     * Calcula precio total (solo boletos VISIBLES, no ocultos)
     * @param {number} cantidadVisibles - Cantidad de boletos visibles
     * @returns {number} Precio total
     */
    calcularPrecio(cantidadVisibles) {
        const precioBoleto = window.rifaplusConfig?.rifa?.precioBoleto || 15;
        return cantidadVisibles * precioBoleto;
    },

    /**
     * Obtiene información de debug
     * @returns {Object} Información de configuración actual
     */
    obtenerDebug() {
        const rangosVisibles = this.obtenerRangosVisibles();
        const rangoOculto = this.obtenerRangoOculto();
        const boletosVisibles = this.contarBoletosVisibles();

        return {
            sistemaActivo: window.rifaplusConfig?.rifa?.oportunidades?.enabled,
            multiplicador: window.rifaplusConfig?.rifa?.oportunidades?.multiplicador,
            rangosVisibles: rangosVisibles.map(r => `${r.nombre} (${r.inicio}-${r.fin})`),
            boletosVisiblesTotal: boletosVisibles,
            rangoOculto: `${rangoOculto.inicio}-${rangoOculto.fin}`,
            boletosOcultosTotal: rangoOculto.cantidad
        };
    }
};

// Exportar para que esté disponible globalmente
window.OportunidadesService = OportunidadesService;

console.log('✅ [OportunidadesService] Inicializado correctamente');
