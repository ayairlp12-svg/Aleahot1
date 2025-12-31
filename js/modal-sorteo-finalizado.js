/**
 * ============================================================
 * ARCHIVO: js/modal-sorteo-finalizado.js
 * DESCRIPCIÓN: Modal de cierre profesional del sorteo
 * VERSION: 2.0 - PRODUCCIÓN ROBUSTA
 * ============================================================
 */

class ModalSorteoFinalizado {
    constructor() {
        this.modalCreado = false;
        this.verificacionActiva = false;
        this.logEnabled = true;
        
        // Log de inicialización
        this.log('🎉 ModalSorteoFinalizado inicializado', 'constructor');
    }

    /**
     * MÉTODO PRINCIPAL - Inicializa el sistema
     */
    inicializar() {
        this.log('Iniciando verificación del estado del sorteo...', 'inicializar');

        // Verificación inmediata
        setTimeout(() => this.verificarEstadoSorteo(), 100);

        // Verificación continua cada segundo (por si cambia el estado dinámicamente)
        this.iniciarVerificacionContinua();
    }

    /**
     * Verifica el estado ACTUAL del sorteo
     */
    verificarEstadoSorteo() {
        try {
            // Si hay una supresión temporal desde otra navegación, no mostrar modal
            try {
                const suppressUntil = parseInt(sessionStorage.getItem('rifaplus_modal_suppressed_until') || '0', 10);
                if (suppressUntil && Date.now() < suppressUntil) {
                    this.log('Supresión de modal activa; omitiendo verificación temporalmente', 'info');
                    return;
                }
            } catch (e) {
                // ignore sessionStorage errors
            }

            const config = window.rifaplusConfig;
            
            if (!config) {
                this.log('❌ CRÍTICO: window.rifaplusConfig no existe', 'error');
                return;
            }

            const sorteoActivo = config.sorteoActivo;
            
            if (!sorteoActivo) {
                this.log('❌ CRÍTICO: sorteoActivo no existe en config', 'error');
                return;
            }

            const estado = sorteoActivo.estado;
            const ahora = Date.now();
            const fechaCierre = new Date(sorteoActivo.fechaCierre).getTime();
            const tiempoRestante = fechaCierre - ahora;

            // CONDICIÓN 1: Estado es directamente 'finalizado'
            if (estado === 'finalizado') {
                this.log('✅ Estado es FINALIZADO - Mostrando modal', 'verificacion');
                this.mostrarModal();
                this.verificacionActiva = false;
                return;
            }

            // CONDICIÓN 2: Hora de cierre alcanzada
            if (ahora >= fechaCierre && estado === 'activo') {
                this.log('⏰ Hora de cierre ALCANZADA - Finalizando sorteo', 'verificacion');
                
                // Cambiar estado automáticamente
                config.sorteoActivo.estado = 'finalizado';
                config.permitirCompras = false;
                
                this.log('✅ Estado actualizado a FINALIZADO', 'actualizacion');
                this.mostrarModal();
                this.verificacionActiva = false;
                return;
            }

            // El sorteo aún está activo (no loguear para evitar spam de consola)

        } catch (error) {
            this.log(`❌ Error en verificarEstadoSorteo: ${error.message}`, 'error');
            console.error(error);
        }
    }

    /**
     * Inicia verificación continua
     */
    iniciarVerificacionContinua() {
        if (this.verificacionActiva) return;

        this.verificacionActiva = true;
        this.log('Iniciando verificación continua cada segundo...', 'verificacion');

        const intervalo = setInterval(() => {
            try {
                // Ejecutar la verificación completa cada segundo.
                // verificarEstadoSorteo() manejará tanto el caso de estado='finalizado'
                // como el caso en que la fecha/hora de cierre ya se alcanzó.
                if (!this.modalCreado) {
                    this.verificarEstadoSorteo();
                } else {
                    // Si el modal ya fue creado, detenemos la verificación
                    clearInterval(intervalo);
                    this.verificacionActiva = false;
                }
            } catch (err) {
                console.warn('Error en verificación continua:', err && err.message);
            }
        }, 1000);
    }

    /**
     * Crea y muestra el modal
     */
    async mostrarModal() {
        try {
            if (this.modalCreado) {
                this.log('Modal ya fue creado, omitiendo...', 'warning');
                return;
            }

            this.log('Creando modal...', 'modal');

            const config = window.rifaplusConfig;
            const sorteo = config.sorteoActivo;

            // Obtener ganadores inmediatamente (consulta al servidor y fallback local)
            const ganadoresReales = await this.obtenerGanadoresReales();

            // Validar que hay ganadores definidos por el administrador
            const tieneGanadores = ganadoresReales && Object.keys(ganadoresReales).some(tipo =>
                ganadoresReales[tipo] && ganadoresReales[tipo].length > 0
            );

            if (!tieneGanadores) {
                this.log('Sin ganadores configurados en servidor - No se mostrará el modal', 'warning');
                return; // No mostrar modal si no hay ganadores persistidos por admin
            }

            // Crear overlay fullscreen
            const overlay = document.createElement('div');
            overlay.id = 'modalSorteoFinalizadoOverlay';
            overlay.className = 'modal-sorteo-overlay';
            overlay.innerHTML = this.generarHTMLModal(sorteo, config, ganadoresReales);

            // Agregar al DOM
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            // Agregar estilos CSS
            this.inyectarCSS();

            // Configurar event listeners
            this.configurarEventListeners();

            // Animación de entrada
            setTimeout(() => {
                overlay.classList.add('modal-visible');
                this.mostrarConfeti();
                this.log('Modal mostrado correctamente', 'exito');
            }, 100);

            this.modalCreado = true;

        } catch (error) {
            this.log(`❌ Error en mostrarModal: ${error.message}`, 'error');
            console.error(error);
        }
    }

    /**
     * Espera a que GanadoresManager esté disponible
     * @param {Function} callback - Función a ejecutar cuando esté disponible
     * @param {number} timeout - Timeout en ms (default 2000)
     */
    esperarGanadoresManager(callback, timeout = 2000) {
        const inicio = Date.now();
        
        const verificar = () => {
            if (window.GanadoresManager) {
                this.log('✅ GanadoresManager está disponible, continuando...', 'exito');
                callback();
                return;
            }

            if (Date.now() - inicio > timeout) {
                this.log('⏱️ Timeout esperando GanadoresManager (2s), continuando sin él...', 'warning');
                callback();
                return;
            }

            setTimeout(verificar, 50); // Reintentar cada 50ms
        };

        verificar();
    }

    /**
     * Genera el HTML del modal
     */
    generarHTMLModal(sorteo, config, ganadoresReales = null) {
        // Usar ganadores reales si están disponibles; sino, caer en el fallback de sorteo.ganadores
        // Normalizamos las claves al formato esperado: `sorteo`, `presorteo`, `ruletazos`
        const ganadoresAUsar = (function() {
            if (ganadoresReales) {
                // Si vienen de la función interna, pueden tener claves variadas; intentar mapear
                if (ganadoresReales.sorteo || ganadoresReales.presorteo || ganadoresReales.ruletazos) {
                    return ganadoresReales;
                }
                // soportar versiones antiguas con `principal`/`presorte`/`ruletazo`
                return {
                    sorteo: ganadoresReales.principal || [],
                    presorteo: ganadoresReales.presorte || [],
                    ruletazos: ganadoresReales.ruletazo || []
                };
            }

            // Fallback desde sorteo.ganadores (estructura antigua)
            return {
                sorteo: (sorteo.ganadores && (sorteo.ganadores.principal || sorteo.ganadores.sorteo)) || [],
                presorteo: (sorteo.ganadores && (sorteo.ganadores.presorte || sorteo.ganadores.presorteo)) || [],
                ruletazos: (sorteo.ganadores && (sorteo.ganadores.ruletazo || sorteo.ganadores.ruletazos)) || []
            };
        })();

        return `
            <div class="modal-sorteo-finalizado">
                <!-- CONFETI DE FONDO -->
                <canvas id="confeti-canvas" class="confeti-canvas"></canvas>

                <!-- CONTENIDO PRINCIPAL -->
                <div class="sorteo-finalizado-content">
                    
                    <!-- HEADER CON LOGO -->
                    <div class="sorteo-header">
                        <div class="sorteo-logo-container">
                            <img src="${config.cliente.logo}" alt="${config.cliente.nombre}" class="sorteo-logo">
                        </div>
                        <h1 class="sorteo-titulo">SORTEO FINALIZADO</h1>
                    </div>

                    <!-- INFORMACIÓN DEL SORTEO -->
                    <div class="sorteo-info-principal">
                        <h2 class="sorteo-nombre">${sorteo.nombre}</h2>
                        <p class="sorteo-organizador">Por: ${config.cliente.nombre}</p>
                        <p class="sorteo-fecha-cierre">Finalizado: ${sorteo.fechaCierreFormato || new Date(sorteo.fechaCierre).toLocaleString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    <!-- MENSAJE DE AGRADECIMIENTO -->
                    <div class="sorteo-agradecimiento">
                        <p>${sorteo.mensajeAgradecimiento}</p>
                    </div>

                    <!-- GANADORES PRINCIPALES (SIEMPRE SE MUESTRA) -->
                    ${this.generarSeccionGanadores('principal', ganadoresAUsar)}

                    <!-- GANADORES PRE-SORTEO (SIEMPRE SE MUESTRA) -->
                    ${this.generarSeccionGanadores('presorte', ganadoresAUsar)}

                    <!-- GANADORES RULETAZO (SIEMPRE SE MUESTRA) -->
                    ${this.generarSeccionGanadores('ruletazo', ganadoresAUsar)}

                    <!-- REDES SOCIALES -->
                    ${this.generarSeccionRedes(config)}

                    <!-- BOTONES DE ACCIÓN -->
                            <div class="sorteo-acciones">
                                <button id="btnVerMisBoletos" class="btn btn-verificar" style="background: linear-gradient(135deg, ${config.tema && config.tema.colores && config.tema.colores.secondary ? config.tema.colores.secondary : '#e8553b'} 0%, ${config.tema && config.tema.colores && config.tema.colores.secondaryDark ? config.tema.colores.secondaryDark : '#D64520'} 100%);">
                                    VERIFICAR MIS BOLETOS
                                </button>
                        ${sorteo.documentos.actaURL ? `
                            <a href="${sorteo.documentos.actaURL}" download class="btn btn-descargar">
                                <i class="fas fa-download"></i> Descargar Acta
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genera la sección de ganadores - IDÉNTICO AL INDEX.HTML
     */
    generarSeccionGanadores(tipo, ganadores) {
        const config = window.rifaplusConfig;
        const colores = config?.tema?.colores || {};
        const colorPrimary = colores.primary || '#0F3A7D';
        const colorPrimaryDark = colores.primaryDark || '#082860';

        // Paleta de colores por tipo
        const colorPaleta = {
            'principal': {
                color: colorPrimary,
                headerColor1: colorPrimary,
                headerColor2: colorPrimaryDark,
                titulo: 'GANADORES DEL SORTEO',
                icono: ''
            },
            'presorte': {
                color: colorPrimary,
                headerColor1: colorPrimary,
                headerColor2: colorPrimaryDark,
                titulo: 'GANADORES DEL PRESORTEO',
                icono: ''
            },
            'ruletazo': {
                color: colorPrimary,
                headerColor1: colorPrimary,
                headerColor2: colorPrimaryDark,
                titulo: 'GANADORES DE RULETAZOS',
                icono: ''
            }
        };

        const tiposMap = {
            'principal': 'sorteo',
            'presorte': 'presorteo',
            'ruletazo': 'ruletazos'
        };

        const listaGanadores = ganadores[tiposMap[tipo]] || [];
        
        if (!listaGanadores || listaGanadores.length === 0) {
            return `
                <div class="sorteo-seccion">
                    <h3 class="sorteo-seccion-titulo">${colorPaleta[tipo].titulo}</h3>
                    <p style="text-align:center; opacity:0.6; font-size:0.85rem; margin:0;">Sin ganadores configurados aún</p>
                </div>
            `;
        }

        const paleta = colorPaleta[tipo] || colorPaleta.principal;
        
        // Ordenar por lugarGanado
        let ganadoresOrdenados = [...listaGanadores].sort((a, b) => {
            const lugarA = Number(a.lugarGanado) || 999;
            const lugarB = Number(b.lugarGanado) || 999;
            return lugarA - lugarB;
        });

        let html = `
            <div class="sorteo-seccion">
                <div style="background: linear-gradient(135deg, ${paleta.headerColor1} 0%, ${paleta.headerColor2} 100%); padding: 8px 12px; border-radius: 8px 8px 0 0; color: white; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; justify-content: space-between;">
                        <span>${paleta.titulo}</span>
                        <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${ganadoresOrdenados.length}</span>
                    </h3>
                </div>
                <div class="sorteo-ganadores-lista grid-compact">
        `;

        ganadoresOrdenados.forEach((ganador, idx) => {
            const nombreCompleto = [ganador.nombre_cliente, ganador.apellido_cliente].filter(Boolean).join(' ') || ganador.nombre || '-';
            const ciudad = ganador.ciudad || '-';
            const estado = ganador.estado_cliente || '-';
            const numeroOrden = ganador.numero || 'N/A';

            // Formatear fecha
            let fechaFormato = '-';
            if (ganador.fechaRegistro) {
                try {
                    const fecha = new Date(ganador.fechaRegistro);
                    if (!isNaN(fecha.getTime())) {
                        fechaFormato = fecha.toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                        });
                    }
                } catch (e) {
                    console.warn('Error formateando fecha:', e);
                }
            }

            // Lugar / etiqueta
            const lugarNumero = ganador.lugarGanado || ganador.posicion || (idx + 1);
            const lugarTexto = (tipo === 'principal') ? this.getNombrePosicion(lugarNumero) : (tipo === 'presorte' ? `Lugar ${lugarNumero}` : `Ruletazo ${lugarNumero}`);

            html += `
                <div class="tarjeta-ganador">
                    <div class="tarjeta-header">
                        <div class="tarjeta-numero"><span class="numero-caja">${numeroOrden}</span></div>
                        <div class="tarjeta-lugar">${lugarTexto}</div>
                    </div>
                    <div class="tarjeta-body">
                        <div class="tarjeta-nombre">${nombreCompleto}</div>
                        <div class="tarjeta-meta">
                            <span>${ciudad}</span>
                            <span>·</span>
                            <span>${estado}</span>
                        </div>
                    </div>
                    <div class="tarjeta-fecha">${fechaFormato}</div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Obtiene el nombre de la posición
     */
    getNombrePosicion(posicion) {
        const nombres = {
            1: '1° LUGAR',
            2: '2° LUGAR',
            3: '3° LUGAR',
            4: '4° LUGAR',
            5: '5° LUGAR'
        };
        return nombres[posicion] || `${posicion}° LUGAR`;
    }

    /**
     * Genera estadísticas
     */
    generarSeccionEstadisticas(sorteo) {
        const stats = sorteo.estadisticas;
        return `
            <div class="sorteo-seccion">
                <h3 class="sorteo-seccion-titulo">ESTADÍSTICAS DEL SORTEO</h3>
                <div class="sorteo-stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Boletos Totales</div>
                        <div class="stat-value">${this.formatearNumero(stats.totalBoletos)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Vendidos</div>
                        <div class="stat-value">${this.formatearNumero(stats.totalVendidos)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Participantes</div>
                        <div class="stat-value">${this.formatearNumero(stats.participantes)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Recaudación</div>
                        <div class="stat-value">$${this.formatearMoneda(stats.recaudacion)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Genera sección de transparencia
     */
    generarSeccionTransparencia(sorteo) {
        const docs = sorteo.documentos;
        return `
            <div class="sorteo-seccion">
                <h3 class="sorteo-seccion-titulo">TRANSPARENCIA Y VERIFICACIÓN</h3>
                <div class="sorteo-transparencia">
                    <p class="transparencia-texto">✓ ${docs.certificado}</p>
                    ${docs.videoURL ? `
                        <a href="${docs.videoURL}" target="_blank" class="btn btn-small">
                            <i class="fas fa-video"></i> Ver Transmisión en Vivo
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Obtener ganadores reales desde GanadoresManager o localStorage
     * Retorna objeto con claves: principal, presorte, ruletazo
     */
    async obtenerGanadoresReales() {
        try {
            this.log('🔍 Intentando obtener ganadores...', 'info');
            
            // Primero intentar fuente de verdad: servidor
            try {
                const resp = await fetch('http://localhost:5001/api/ganadores?limit=500');
                if (resp.ok) {
                    const payload = await resp.json();
                    const rows = payload && payload.data ? payload.data : [];
                    if (Array.isArray(rows) && rows.length > 0) {
                        this.log('✅ Ganadores obtenidos desde servidor', 'exito');
                        // Mapear a estructura esperada
                        const mapped = { sorteo: [], presorteo: [], ruletazos: [] };
                        rows.forEach((r, idx) => {
                            const tipoRaw = (r.tipo_ganador || '').toString().toLowerCase();
                            let key = 'sorteo';
                            if (tipoRaw.includes('presorte')) key = 'presorteo';
                            else if (tipoRaw.includes('rulet')) key = 'ruletazos';
                            const numero = r.numero_boleto || r.numero_orden || '';
                            mapped[key].push({
                                numero: String(numero),
                                numeroFormateado: String(numero),
                                posicion: r.posicion || (idx + 1),
                                nombre_cliente: r.nombre_ganador || r.nombre_cliente || ''
                            });
                        });
                        return mapped;
                    }
                }
            } catch (e) {
                this.log('⚠️ Error al consultar /api/ganadores: ' + (e && e.message), 'warning');
            }

            this.log('⚠️ Usando GanadoresManager/localStorage como fallback', 'warning');

            // Fallback: GanadoresManager si existe
            if (window.GanadoresManager && typeof window.GanadoresManager.obtenerFormateados === 'function') {
                const formateados = window.GanadoresManager.obtenerFormateados() || {};
                return {
                    sorteo: formateados.sorteo || [],
                    presorteo: formateados.presorteo || [],
                    ruletazos: formateados.ruletazos || []
                };
            }

            // Fallback final: localStorage
            try {
                const datosJSON = localStorage.getItem('rifaplus_ganadores');
                if (!datosJSON) return { sorteo: [], presorteo: [], ruletazos: [] };
                const datos = JSON.parse(datosJSON);
                return {
                    sorteo: datos.sorteo || [],
                    presorteo: datos.presorteo || [],
                    ruletazos: datos.ruletazos || []
                };
            } catch (err) {
                return { sorteo: [], presorteo: [], ruletazos: [] };
            }

        } catch (error) {
            this.log('❌ Error obteniendo ganadores: ' + error.message, 'error');
            return { principal: [], presorte: [], ruletazo: [] };
        }
    }

    /**
     * Genera redes sociales
     */
    generarSeccionRedes(config) {
        const redes = config.cliente.redesSociales;
        let html = `
            <div class="sorteo-seccion">
                <p class="sorteo-redes-mensaje">Felicidades a todos los ganadores. Síguenos en nuestras redes sociales para ver la transmisión en vivo del sorteo y mantenerte al tanto de futuros sorteos. Gracias por la confianza.</p>
                <div class="sorteo-redes">
        `;

        if (redes.whatsapp) {
            html += `
                <a href="https://wa.me/${redes.whatsapp.replace(/[^0-9]/g, '')}" 
                   target="_blank" class="red-btn whatsapp" title="WhatsApp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            `;
        }
        if (redes.facebook) {
            html += `
                <a href="${redes.facebook}" target="_blank" class="red-btn facebook" title="Facebook">
                    <i class="fab fa-facebook-f"></i> Facebook
                </a>
            `;
        }
        if (redes.instagram) {
            html += `
                <a href="${redes.instagram}" target="_blank" class="red-btn instagram" title="Instagram">
                    <i class="fab fa-instagram"></i> Instagram
                </a>
            `;
        }

        html += `</div></div>`;
        return html;
    }

    /**
     * Configura event listeners
     */
    configurarEventListeners() {
        try {
            // Delegated listener on overlay to ensure button works even if DOM timing changes
            const overlay = document.getElementById('modalSorteoFinalizadoOverlay');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    const btn = e.target.closest && e.target.closest('#btnVerMisBoletos');
                    if (btn) {
                        // Evitar que el listener global de bloqueo intercepte el click
                        e.preventDefault();
                        e.stopPropagation();

                        // Suprimir modal por un corto periodo para la navegación (10s)
                        try {
                            sessionStorage.setItem('rifaplus_modal_suppressed_until', String(Date.now() + 10000));
                            // Permitir acceso temporal a la página restringida desde el modal
                            sessionStorage.setItem('rifaplus_allow_restricted', '1');
                        } catch (err) {
                            console.warn('No se pudo setear suppression/allow en sessionStorage', err);
                        }

                        // Remover overlay para liberar navegación inmediata
                        const ov = document.getElementById('modalSorteoFinalizadoOverlay');
                        if (ov && ov.parentNode) {
                            ov.parentNode.removeChild(ov);
                        }
                        document.body.style.overflow = '';

                        this.log('Redirigiendo a mis-boletos-restringido.html (supresión activa)', 'navegacion');
                        window.location.href = 'mis-boletos-restringido.html';
                    }
                });
            }
        } catch (error) {
            this.log(`Error en configurarEventListeners: ${error.message}`, 'error');
        }
    }

    /**
     * Muestra confeti
     */
    mostrarConfeti() {
        try {
            const canvas = document.getElementById('confeti-canvas');
            if (!canvas) return;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const ctx = canvas.getContext('2d');
            const confetis = [];

            for (let i = 0; i < 100; i++) {
                confetis.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height - canvas.height,
                    velocityX: (Math.random() - 0.5) * 8,
                    velocityY: Math.random() * 5 + 5,
                    size: Math.random() * 5 + 2,
                    color: ['#e8553b', '#0F3A7D', '#10B981', '#F59E0B', '#8B5CF6'][
                        Math.floor(Math.random() * 5)
                    ]
                });
            }

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                confetis.forEach((conf) => {
                    conf.y += conf.velocityY;
                    conf.x += conf.velocityX;
                    conf.velocityY += 0.2;

                    ctx.fillStyle = conf.color;
                    ctx.fillRect(conf.x, conf.y, conf.size, conf.size);
                });

                if (confetis.some(c => c.y < canvas.height)) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        } catch (error) {
            this.log(`Error en mostrarConfeti: ${error.message}`, 'error');
        }
    }

    /**
     * Bloquea navegación
     */
    bloquearNavegacion() {
        try {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a');
                if (!target) return;

                const href = target.getAttribute('href');
                
                if (href && !href.includes('mis-boletos') && 
                    !href.includes('facebook') && 
                    !href.includes('instagram') && 
                    !href.includes('whatsapp') &&
                    !href.includes('youtube') &&
                    !href.includes('.pdf') &&
                    !href.startsWith('#')) {
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const modal = document.getElementById('modalSorteoFinalizadoOverlay');
                    if (modal) {
                        const alerta = document.createElement('div');
                        alerta.className = 'sorteo-alerta';
                        alerta.innerHTML = `
                            <div class="alerta-contenido">
                                <p>Durante el cierre del sorteo solo puedes acceder a <strong>"Mis Boletos"</strong></p>
                                <button class="btn btn-small" onclick="this.parentElement.parentElement.remove()">Entendido</button>
                            </div>
                        `;
                        modal.appendChild(alerta);
                        
                        setTimeout(() => alerta.remove(), 4000);
                    }
                }
            });
        } catch (error) {
            this.log(`Error en bloquearNavegacion: ${error.message}`, 'error');
        }
    }

    /**
     * Utilidades
     */
    formatearNumero(num) {
        return num.toLocaleString('es-MX');
    }

    formatearMoneda(num) {
        return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /**
     * Sistema de logging robusto
     */
    log(mensaje, tipo = 'info') {
        if (!this.logEnabled) return;

        const timestamp = new Date().toLocaleTimeString('es-MX');
        const prefijo = {
            'info': 'ℹ️',
            'exito': '✅',
            'error': '❌',
            'warning': '⚠️',
            'constructor': '🎉',
            'inicializar': '🚀',
            'estado': '📊',
            'hora': '⏰',
            'fecha': '📅',
            'tiempo': '⏱️',
            'verificacion': '🔍',
            'actualizacion': '🔄',
            'cambio': '⚡',
            'modal': '🎭',
            'navegacion': '🔗'
        }[tipo] || '•';

        console.log(`[${timestamp}] ${prefijo} [SorteoFinalizado] ${mensaje}`);
    }

    /**
     * Inyecta CSS
     */
    inyectarCSS() {
        if (document.getElementById('modal-sorteo-finalizado-css')) return;

        const style = document.createElement('style');
        style.id = 'modal-sorteo-finalizado-css';
        style.textContent = `
            /* ===== MODAL SORTEO FINALIZADO ===== */
            
            .modal-sorteo-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #0F3A7D 0%, #082860 100%);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .modal-sorteo-overlay.modal-visible {
                opacity: 1;
            }

            .confeti-canvas {
                position: absolute;
                top: 0;
                left: 0;
                pointer-events: none;
            }

            .modal-sorteo-finalizado {
                position: relative;
                width: 95%;
                max-width: 700px;
                max-height: 90vh;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                overflow: hidden;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .sorteo-finalizado-content {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                scroll-behavior: smooth;
            }

            .sorteo-header {
                text-align: center;
                padding: 20px 15px;
                background: linear-gradient(135deg, #0F3A7D 0%, #1B5FB8 100%);
                color: white;
                border-radius: 20px 20px 0 0;
                flex-shrink: 0;
            }

            .sorteo-logo-container {
                margin-bottom: 8px;
            }

            .sorteo-logo {
                max-width: 80px;
                height: auto;
            }

            .sorteo-titulo {
                font-size: 1.8rem;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .sorteo-info-principal {
                text-align: center;
                padding: 12px 15px;
                background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
                border-bottom: 2px solid #e5e7eb;
                flex-shrink: 0;
            }

            .sorteo-nombre {
                font-size: 1.1rem;
                margin: 0 0 5px 0;
                color: #1F2937;
            }

            .sorteo-organizador {
                color: #6B7280;
                margin: 2px 0;
                font-size: 0.85rem;
            }

            .sorteo-fecha-cierre {
                color: #e8553b;
                font-weight: 600;
                margin: 2px 0 0 0;
                font-size: 0.85rem;
            }

            .sorteo-agradecimiento {
                padding: 12px 15px;
                background: #fff3cd;
                border-left: 4px solid #FCD34D;
                text-align: center;
                color: #856404;
                font-size: 0.85rem;
                line-height: 1.4;
                flex-shrink: 0;
            }

            .sorteo-scroll-container {
                display: contents;
            }

            .sorteo-scroll-container::-webkit-scrollbar {
                width: 8px;
            }

            .sorteo-scroll-container::-webkit-scrollbar-track {
                background: #f0f0f0;
            }

            .sorteo-scroll-container::-webkit-scrollbar-thumb {
                background: #0F3A7D;
                border-radius: 4px;
            }

            .sorteo-seccion {
                margin: 12px 0;
                padding: 0 15px;
            }

            .sorteo-seccion-titulo {
                font-size: 1rem;
                color: #0F3A7D;
                margin: 0 0 8px 0;
                padding-bottom: 5px;
                border-bottom: 2px solid #e5e7eb;
            }

            .sorteo-ganadores-lista {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 8px;
            }

            .sorteo-ganador-card {
                background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 8px;
                text-align: center;
                transition: transform 0.12s, box-shadow 0.12s;
                font-size: 0.85rem;
            }

            .sorteo-ganador-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }

            .ganador-medalla {
                font-size: 1.4rem;
                margin-bottom: 4px;
            }

            .ganador-posicion {
                font-size: 0.9rem;
                font-weight: 700;
                color: #0F3A7D;
                margin-bottom: 4px;
            }

            /* Tarjeta compacta nueva */
            .tarjeta-ganador {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                min-height: 90px;
                box-sizing: border-box;
            }

            .tarjeta-header { display:flex; justify-content:space-between; align-items:center; }
            .tarjeta-numero { font-weight:700; color: var(--ganador-color, #0F3A7D); font-size:0.95rem; }
            .tarjeta-lugar { font-size:0.8rem; color:#6B7280; }
            .tarjeta-nombre { font-weight:600; font-size:0.9rem; color:#1F2937; }
            .tarjeta-meta { color:#6B7280; font-size:0.8rem; display:flex; gap:6px; }
            .tarjeta-fecha { color:#9CA3AF; font-size:0.75rem; text-align:right; }

            .ganador-divider {
                height: 2px;
                background: #e8553b;
                margin: 5px 0;
            }

            .ganador-premio {
                font-size: 0.95rem;
                font-weight: 600;
                color: #1F2937;
                margin-bottom: 4px;
            }

            .ganador-numero {
                color: #6B7280;
                font-size: 0.8rem;
                margin-bottom: 6px;
            }

            .ganador-numero strong {
                color: #0F3A7D;
                font-weight: 700;
            }

            .ganador-persona {
                background: white;
                padding: 6px;
                border-radius: 6px;
                margin-top: 5px;
            }

            .ganador-nombre {
                font-size: 0.9rem;
                font-weight: 600;
                color: #0F3A7D;
            }

            .ganador-ubicacion {
                color: #6B7280;
                font-size: 0.75rem;
                margin-top: 3px;
            }

            .sorteo-ganador-simple {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                font-size: 0.85rem;
            }

            .simple-numero strong {
                color: #0F3A7D;
                font-weight: 700;
            }

            .simple-premio {
                color: #e8553b;
                font-weight: 600;
            }

            .sorteo-stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                padding: 0 15px;
                margin: 8px 0;
            }

            .stat-item {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 10px;
                text-align: center;
            }

            .stat-label {
                color: #6B7280;
                font-size: 0.75rem;
                margin-bottom: 3px;
            }

            .stat-value {
                font-size: 1rem;
                font-weight: 700;
                color: #0F3A7D;
            }

            .sorteo-transparencia {
                background: white;
                border: 1px solid #10B981;
                border-radius: 6px;
                padding: 10px;
                text-align: center;
                margin: 8px 15px;
            }

            .transparencia-texto {
                color: #10B981;
                font-weight: 600;
                margin: 0 0 8px 0;
                font-size: 0.9rem;
            }

            .sorteo-redes-mensaje {
                text-align: center;
                color: #374151;
                font-size: 0.95rem;
                margin: 6px 15px 2px 15px;
                line-height: 1.3;
                font-weight: 700;
            }

            .sorteo-redes {
                display: flex;
                gap: 6px;
                justify-content: center;
                flex-wrap: wrap;
                padding: 0 15px;
                margin: 8px 0;
            }

            .red-btn {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                text-decoration: none;
                transition: transform 0.2s, box-shadow 0.2s;
                color: white;
            }

            .red-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            .red-btn.whatsapp { background: #25D366; }
            .red-btn.facebook { background: #1877F2; }
            .red-btn.instagram { background: linear-gradient(45deg, #feda75 0%, #fa7e1e 20%, #d62976 40%, #962fbf 60%, #4f5bd5 80%); }

            /* Número en recuadro dentro de la tarjeta de ganador */
            .numero-caja {
                display: inline-block;
                background: var(--ganador-color, #0F3A7D);
                color: #ffffff;
                padding: 6px 10px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 0.95rem;
                line-height: 1;
            }

            .sorteo-acciones {
                padding: 12px 15px;
                background: #f8f9fa;
                border-top: 2px solid #e5e7eb;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                justify-content: center;
                border-radius: 0 0 20px 20px;
                flex-shrink: 0;
            }

            .btn-verificar {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 10px 16px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.85rem;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                flex: 1;
                min-width: 150px;
            }

            .btn-verificar:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
            }

            .btn-descargar {
                background: white;
                color: #0F3A7D;
                border: 2px solid #0F3A7D;
                padding: 8px 14px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.85rem;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-descargar:hover {
                background: #0F3A7D;
                color: white;
            }

            .btn-small {
                display: inline-block;
                padding: 6px 12px;
                background: #0F3A7D;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 0.8rem;
                text-decoration: none;
                cursor: pointer;
                margin-top: 6px;
            }

            .sorteo-alerta {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                animation: fadeInScale 0.3s ease;
            }

            @keyframes fadeInScale {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }

            .alerta-contenido {
                text-align: center;
            }

            .alerta-contenido p {
                color: #1F2937;
                margin: 0 0 15px 0;
                font-size: 1rem;
            }

            .alerta-contenido .btn-small {
                margin-top: 0;
            }

            @media (max-width: 768px) {
                .sorteo-titulo { font-size: 1.8rem; }
                .sorteo-nombre { font-size: 1.2rem; }
                .sorteo-stats-grid { grid-template-columns: 1fr; }
                .sorteo-acciones { flex-direction: column; }
                .btn-verificar { min-width: auto; }
                .sorteo-redes { gap: 8px; }
                .red-btn { flex: 1; min-width: 100px; justify-content: center; }
            }
        `;

        document.head.appendChild(style);
    }
}

// ============================================================
// INSTANCIA GLOBAL Y EXPORTACIÓN
// ============================================================

const modalSorteoFinalizado = new ModalSorteoFinalizado();
window.ModalSorteoFinalizado = ModalSorteoFinalizado;
window.modalSorteoFinalizado = modalSorteoFinalizado;

// Log de carga
console.log('✅ modal-sorteo-finalizado.js cargado correctamente');
