/**
 * ============================================================
 * ARCHIVO: js/ganadores.js
 * DESCRIPCIÓN: Sistema completo de gestión de ganadores
 * Maneja almacenamiento, validación y sincronización de ganadores
 * ============================================================
 */

// Namespace para evitar conflictos
window.ganadesoresManager = window.ganadesoresManager || {};

const GanadoresManager = {
    // Clave para localStorage
    STORAGE_KEY: 'rifaplus_ganadores',
    
    /**
     * Obtener la configuración de ganadores desde config.js
     * @returns {Object} Configuración de ganadores
     */
    getConfig() {
        if (!window.rifaplusConfig || !window.rifaplusConfig.rifa || !window.rifaplusConfig.rifa.ganadores) {
            return { sorteo: 0, presorteo: 0, ruletazos: 0 };
        }
        return window.rifaplusConfig.rifa.ganadores;
    },

    /**
     * Obtener tipos de ganadores habilitados (con cantidad > 0)
     * @returns {Array} Array con tipos habilitados
     */
    getTiposHabilitados() {
        const config = this.getConfig();
        const tipos = [];
        
        if (config.sorteo > 0) tipos.push('sorteo');
        if (config.presorteo > 0) tipos.push('presorteo');
        if (config.ruletazos > 0) tipos.push('ruletazos');
        
        return tipos;
    },

    /**
     * Obtener etiqueta amigable para cada tipo de ganador
     * @param {String} tipo - Tipo de ganador (sorteo, presorteo, ruletazos)
     * @returns {String} Etiqueta formateada
     */
    getEtiquetaTipo(tipo) {
        const etiquetas = {
            sorteo: '🏆 Ganador del Sorteo',
            presorteo: '🎁 Ganador Presorteo',
            ruletazos: '🎰 Ganador Ruletazo'
        };
        return etiquetas[tipo] || tipo;
    },

    /**
     * Obtener icono para cada tipo de ganador
     * @param {String} tipo - Tipo de ganador
     * @returns {String} Icono emoji
     */
    getIconoTipo(tipo) {
        const iconos = {
            sorteo: '🏆',
            presorteo: '🎁',
            ruletazos: '🎰'
        };
        return iconos[tipo] || '⭐';
    },

    /**
     * Cargar ganadores desde localStorage
     * @returns {Object} Ganadores registrados
     */
    cargarGanadores() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return { sorteo: [], presorteo: [], ruletazos: [] };
            
            const ganadores = JSON.parse(data);
            
            // Validar estructura
            if (!ganadores.sorteo) ganadores.sorteo = [];
            if (!ganadores.presorteo) ganadores.presorteo = [];
            if (!ganadores.ruletazos) ganadores.ruletazos = [];
            
            return ganadores;
        } catch (error) {
            return { sorteo: [], presorteo: [], ruletazos: [] };
        }
    },

    /**
     * Guardar ganadores en localStorage
     * @param {Object} ganadores - Objeto con ganadores por tipo
     * @returns {Boolean} Éxito de la operación
     */
    guardarGanadores(ganadores) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ganadores));
            // Disparar evento para sincronización entre pestañas
            window.dispatchEvent(new CustomEvent('ganadesoresActualizados', { detail: ganadores }));
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * Agregar un ganador nuevo
     * @param {String} numero - Número del boleto ganador
     * @param {String} tipo - Tipo de ganador (sorteo, presorteo, ruletazos)
     * @param {Object} datosCliente - Datos opcionales del cliente {nombre, apellido, ciudad, estado}
     * @param {Number} lugarGanado - Lugar en que ganó (1, 2, 3, etc) - opcional
     * @returns {Object} {exito: Boolean, mensaje: String}
     */
    agregarGanador(numero, tipo, datosCliente = {}, lugarGanado = null) {
        // Validar que tipo esté habilitado
        const config = this.getConfig();
        if (config[tipo] === 0) {
            return { exito: false, mensaje: `❌ El tipo "${tipo}" no está habilitado en la configuración` };
        }

        // Validar número
        numero = String(numero).trim();
        if (!numero || isNaN(numero)) {
            return { exito: false, mensaje: '❌ El número debe ser válido' };
        }

        const ganadores = this.cargarGanadores();
        
        // Validar que no sea duplicado
        if (ganadores[tipo].some(g => g.numero === numero)) {
            return { exito: false, mensaje: `❌ El número ${numero} ya está registrado como ganador de ${tipo}` };
        }

        // Validar cantidad de ganadores del tipo
        if (ganadores[tipo].length >= config[tipo]) {
            return { exito: false, mensaje: `❌ Ya tienes el máximo de ganadores (${config[tipo]}) para ${tipo}` };
        }

        // Agregar ganador con datos del cliente opcionales
        const ganador = {
            numero: numero,
            tipo: tipo,
            fechaRegistro: new Date().toISOString(),
            posicion: ganadores[tipo].length + 1
        };

        // Agregar lugar ganado si se proporciona
        if (lugarGanado !== null && lugarGanado !== undefined) {
            ganador.lugarGanado = Number(lugarGanado);
        }

        // Agregar datos del cliente si se proporcionan
        if (datosCliente && typeof datosCliente === 'object') {
            if (datosCliente.nombre) ganador.nombre_cliente = datosCliente.nombre;
            if (datosCliente.apellido) ganador.apellido_cliente = datosCliente.apellido;
            if (datosCliente.ciudad) ganador.ciudad = datosCliente.ciudad;
            if (datosCliente.estado_cliente) ganador.estado_cliente = datosCliente.estado_cliente;
        }

        ganadores[tipo].push(ganador);

        // Guardar
        if (this.guardarGanadores(ganadores)) {
            return { exito: true, mensaje: `✅ Ganador ${numero} registrado como ${this.getEtiquetaTipo(tipo)}` };
        } else {
            return { exito: false, mensaje: '❌ Error al guardar el ganador' };
        }
    },

    /**
     * Eliminar un ganador
     * @param {String} numero - Número del ganador
     * @param {String} tipo - Tipo de ganador
     * @returns {Boolean} Éxito de la operación
     */
    eliminarGanador(numero, tipo) {
        const ganadores = this.cargarGanadores();
        
        const indexAnterior = ganadores[tipo].length;
        ganadores[tipo] = ganadores[tipo].filter(g => g.numero !== numero);
        
        if (ganadores[tipo].length < indexAnterior) {
            // Actualizar posiciones
            ganadores[tipo].forEach((g, idx) => {
                g.posicion = idx + 1;
            });
            
            return this.guardarGanadores(ganadores);
        }
        
        return false;
    },

    /**
     * Obtener todos los ganadores
     * @returns {Object} Todos los ganadores registrados
     */
    obtenerTodos() {
        return this.cargarGanadores();
    },

    /**
     * Obtener ganadores de un tipo específico
     * @param {String} tipo - Tipo de ganador
     * @returns {Array} Ganadores del tipo especificado
     */
    obtenerPorTipo(tipo) {
        const ganadores = this.cargarGanadores();
        return ganadores[tipo] || [];
    },

    /**
     * Verificar si existe un ganador
     * @param {String} numero - Número a verificar
     * @returns {Object|null} Ganador encontrado o null
     */
    verificarGanador(numero) {
        const ganadores = this.cargarGanadores();
        numero = String(numero).trim();
        
        for (const tipo of ['sorteo', 'presorteo', 'ruletazos']) {
            const ganador = ganadores[tipo].find(g => g.numero === numero);
            if (ganador) return ganador;
        }
        
        return null;
    },

    /**
     * Contar ganadores registrados
     * @returns {Object} Conteo por tipo
     */
    contar() {
        const ganadores = this.cargarGanadores();
        return {
            sorteo: ganadores.sorteo.length,
            presorteo: ganadores.presorteo.length,
            ruletazos: ganadores.ruletazos.length,
            total: ganadores.sorteo.length + ganadores.presorteo.length + ganadores.ruletazos.length
        };
    },

    /**
     * Verificar si hay ganadores registrados
     * @returns {Boolean} True si hay al menos 1 ganador
     */
    hayGanadores() {
        const conteo = this.contar();
        return conteo.total > 0;
    },

    /**
     * Limpiar todos los ganadores (útil para reiniciar sorteo)
     * @returns {Boolean} Éxito de la operación
     */
    limpiarTodos() {
        return this.guardarGanadores({ sorteo: [], presorteo: [], ruletazos: [] });
    },

    /**
     * Obtener ganadores formateados para mostrar
     * @returns {Object} Ganadores con información formateada
     */
    obtenerFormateados() {
        const ganadores = this.cargarGanadores();
        const config = this.getConfig();
        const resultado = {};

        for (const tipo of ['sorteo', 'presorteo', 'ruletazos']) {
            if (config[tipo] > 0) {
                resultado[tipo] = ganadores[tipo].map((g, idx) => ({
                    ...g,
                    icono: this.getIconoTipo(tipo),
                    etiqueta: this.getEtiquetaTipo(tipo),
                    numeroFormateado: String(g.numero).padStart(5, '0')
                }));
            }
        }

        return resultado;
    }
};

// Hacer disponible globalmente
window.GanadoresManager = GanadoresManager;

// Log de inicialización y diagnóstico
(function() {
    const conteo = GanadoresManager.contar();
    const datos = GanadoresManager.cargarGanadores();
    console.log('✅ GanadoresManager inicializado');
    console.log('   Storage Key:', GanadoresManager.STORAGE_KEY);
    console.log('   Ganadores cargados:', conteo);
    console.log('   Datos raw:', JSON.stringify(datos, null, 2));
})();

// Escuchar cambios de ganadores desde otras pestañas
window.addEventListener('storage', function(e) {
    if (e.key === GanadoresManager.STORAGE_KEY) {
        // Los ganadores cambiaron en otra pestaña
        window.dispatchEvent(new CustomEvent('ganadesoresActualizados', { detail: GanadoresManager.cargarGanadores() }));
    }
});
