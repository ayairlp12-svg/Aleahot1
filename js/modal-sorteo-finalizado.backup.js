/**
 * ============================================================
// modal-sorteo-finalizado.backup.js - neutralizado: backup eliminado por limpieza
// Archivo dejado intencionalmente vacío. Use modal-sorteo-finalizado.js en su lugar.
 * DESCRIPCIÓN: Modal de cierre profesional del sorteo
 * - Muestra ganadores en orden jerárquico
 * - Acceso restringido solo a Mis Boletos
 * - Bloquea navegación a otras páginas
 * ============================================================
 */

class ModalSorteoFinalizado {
    constructor() {
        this.sorteoFinalizado = window.rifaplusConfig?.sorteoActivo?.estado === 'finalizado';
        this.tiempoVerificacion = 1000; // Verificar cada segundo
        this.modalCreado = false;
    }

    /**
     * Inicializa el sistema de cierre del sorteo
     * Se llama desde main.js
     */
    inicializar() {
        if (!this.sorteoFinalizado) return;

        console.log('🎉 [SorteoFinalizado] Inicializando modal de cierre...');
        
        // Mostrar modal cuando el DOM está listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.mostrarModal());
        } else {
            this.mostrarModal();
        }

        // Configurar bloqueo de navegación
        this.bloquearNavegacion();
    }

    /**
     * Verifica si el sorteo debe finalizarse por hora
     * Se ejecuta continuamente para detectar el momento exacto
     */
    verificarCierrePorHora() {
        const ahora = Date.now();
        const fechaCierre = new Date(window.rifaplusConfig.sorteoActivo.fechaCierre).getTime();

        if (ahora >= fechaCierre && !this.sorteoFinalizado) {
            console.log('⏰ [SorteoFinalizado] ¡Hora de cierre alcanzada!');
            
            // Cambiar estado en config
            window.rifaplusConfig.sorteoActivo.estado = 'finalizado';
            window.rifaplusConfig.permitirCompras = false;
            
            // Mostrar modal
            this.mostrarModal();
            this.bloquearNavegacion();
        }
    }

    /**
     * Crea y muestra el modal de sorteo finalizado
     */
    mostrarModal() {
        if (this.modalCreado) return;

        const config = window.rifaplusConfig;
        const sorteo = config.sorteoActivo;

        // Crear overlay fullscreen
        const overlay = document.createElement('div');
        overlay.id = 'modalSorteoFinalizadoOverlay';
        overlay.className = 'modal-sorteo-overlay';
        overlay.innerHTML = this.generarHTMLModal(sorteo, config);

        // Agregar al DOM
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        // Agregar estilos CSS si no existen
        this.inyectarCSS();

        // Agregar event listeners
        this.configurarEventListeners();

        // Animación de entrada
        setTimeout(() => {
            overlay.classList.add('modal-visible');
            this.mostrarConfeti();
        }, 100);

        this.modalCreado = true;
        console.log('✅ [SorteoFinalizado] Modal mostrado correctamente');
    }

    /**
     * Genera el HTML del modal
     */
    generarHTMLModal(sorteo, config) {
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
                        <h1 class="sorteo-titulo">🎉 SORTEO FINALIZADO</h1>
                    </div>

                    <!-- INFORMACIÓN DEL SORTEO -->
                    <div class="sorteo-info-principal">
                        <h2 class="sorteo-nombre">${sorteo.nombre}</h2>
                        <p class="sorteo-organizador">Por: ${config.cliente.nombre}</p>
                        <p class="sorteo-fecha-cierre">Finalizado: ${sorteo.fechaCierreFormato}</p>
                    </div>

                    <!-- MENSAJE DE AGRADECIMIENTO -->
                    <div class="sorteo-agradecimiento">
                        <p>${sorteo.mensajeAgradecimiento}</p>
                    </div>

                    <!-- SCROLL CONTAINER -->
                    <div class="sorteo-scroll-container">

                        <!-- GANADORES PRINCIPALES -->
                        ${this.generarSeccionGanadores('principal', sorteo)}

                        <!-- GANADORES PRE-SORTEO -->
                        ${sorteo.ganadores.presorte.length > 0 ? this.generarSeccionGanadores('presorte', sorteo) : ''}

                        <!-- GANADORES RULETAZO -->
                        ${sorteo.ganadores.ruletazo.length > 0 ? this.generarSeccionGanadores('ruletazo', sorteo) : ''}

                        <!-- ESTADÍSTICAS -->
                        ${this.generarSeccionEstadisticas(sorteo)}

                        <!-- TRANSPARENCIA Y DOCUMENTOS -->
                        ${this.generarSeccionTransparencia(sorteo)}

                        <!-- REDES SOCIALES -->
                        ${this.generarSeccionRedes(config)}

                    </div>

                    <!-- BOTONES DE ACCIÓN -->
                    <div class="sorteo-acciones">
                        <button id="btnVerMisBoletos" class="btn btn-verificar">
                            <i class="fas fa-ticket-alt"></i> VERIFICAR MIS BOLETOS
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
     * Genera la sección de ganadores según tipo
     */
    generarSeccionGanadores(tipo, sorteo) {
        const ganadores = sorteo.ganadores[tipo];
        if (!ganadores || ganadores.length === 0) return '';

        const titulo = {
            'principal': '🏆 GANADORES DEL SORTEO PRINCIPAL',
            'presorte': '🎁 GANADORES DEL PRE-SORTEO',
            'ruletazo': '🎡 GANADORES DEL RULETAZO'
        }[tipo];

        const medallas = ['🥇', '🥈', '🥉'];

        let html = `<div class="sorteo-seccion">
            <h3 class="sorteo-seccion-titulo">${titulo}</h3>
            <div class="sorteo-ganadores-lista">`;

        ganadores.forEach((ganador, index) => {
            if (tipo === 'principal') {
                // Formato para ganadores principales
                html += `
                    <div class="sorteo-ganador-card ganador-principal">
                        <div class="ganador-medalla">${medallas[index] || '🏅'}</div>
                        <div class="ganador-posicion">${this.getNombrePosicion(ganador.posicion || index + 1)}</div>
                        <div class="ganador-divider"></div>
                        <div class="ganador-premio">${ganador.premio}</div>
                        <div class="ganador-numero">Boleto: <strong>${ganador.numeroOrden}</strong></div>
                        <div class="ganador-persona">
                            <div class="ganador-nombre">${ganador.nombreParcial}</div>
                            <div class="ganador-ubicacion">📍 ${ganador.estado}</div>
                        </div>
                    </div>
                `;
            } else {
                // Formato simplificado para otros ganadores
                html += `
                    <div class="sorteo-ganador-simple">
                        <span class="simple-numero">Boleto: <strong>${ganador.numeroOrden}</strong></span>
                        <span class="simple-premio">${ganador.premio}</span>
                    </div>
                `;
            }
        });

        html += `</div></div>`;
        return html;
    }

    /**
     * Obtiene el nombre de la posición (1° LUGAR, 2° LUGAR, etc)
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
     * Genera la sección de estadísticas
     */
    generarSeccionEstadisticas(sorteo) {
        const stats = sorteo.estadisticas;
        return `
            <div class="sorteo-seccion">
                <h3 class="sorteo-seccion-titulo">📊 ESTADÍSTICAS DEL SORTEO</h3>
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
     * Genera la sección de transparencia
     */
    generarSeccionTransparencia(sorteo) {
        const docs = sorteo.documentos;
        return `
            <div class="sorteo-seccion">
                <h3 class="sorteo-seccion-titulo">🔐 TRANSPARENCIA Y VERIFICACIÓN</h3>
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
     * Genera la sección de redes sociales
     */
    generarSeccionRedes(config) {
        const redes = config.cliente.redesSociales;
        let html = `
            <div class="sorteo-seccion">
                <h3 class="sorteo-seccion-titulo">📱 SÍGUENOS EN REDES SOCIALES</h3>
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
     * Bloquea la navegación a otras páginas
     */
    bloquearNavegacion() {
        // Bloquear clicks en links
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;

            const href = target.getAttribute('href');
            
            // Permitir: Mis Boletos, redes sociales, descarga de archivos
            if (href && !href.includes('mis-boletos') && 
                !href.includes('facebook') && 
                !href.includes('instagram') && 
                !href.includes('whatsapp') &&
                !href.includes('youtube') &&
                !href.includes('.pdf') &&
                !href.startsWith('#')) {
                
                e.preventDefault();
                e.stopPropagation();
                
                // Mostrar alerta
                const modal = document.getElementById('modalSorteoFinalizadoOverlay');
                if (modal) {
                    const alerta = document.createElement('div');
                    alerta.className = 'sorteo-alerta';
                    alerta.innerHTML = `
                        <div class="alerta-contenido">
                            <p>⏳ Durante el cierre del sorteo solo puedes acceder a <strong>"Mis Boletos"</strong></p>
                            <button class="btn btn-small" onclick="this.parentElement.parentElement.remove()">Entendido</button>
                        </div>
                    `;
                    modal.appendChild(alerta);
                    
                    setTimeout(() => alerta.remove(), 4000);
                }
            }
        });

        // Bloquear navegación por tecla del navegador
        window.addEventListener('beforeunload', (e) => {
            const urlActual = window.location.pathname;
            if (!urlActual.includes('mis-boletos') && !window.location.href.includes('facebook')) {
                // Permitir navegación pero mostrar advertencia
            }
        });
    }

    /**
     * Configura los event listeners del modal
     */
    configurarEventListeners() {
        const btnVerMisBoletos = document.getElementById('btnVerMisBoletos');
        if (btnVerMisBoletos) {
            btnVerMisBoletos.addEventListener('click', () => {
                // Abrir Mis Boletos en modo restringido
                window.location.href = 'mis-boletos-restringido.html';
            });
        }
    }

    /**
     * Muestra animación de confeti
     */
    mostrarConfeti() {
        const canvas = document.getElementById('confeti-canvas');
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        const confetis = [];

        // Crear partículas de confeti
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

        // Animar confeti
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confetis.forEach((conf) => {
                conf.y += conf.velocityY;
                conf.x += conf.velocityX;
                conf.velocityY += 0.2; // Gravedad

                ctx.fillStyle = conf.color;
                ctx.fillRect(conf.x, conf.y, conf.size, conf.size);
            });

            // Detener cuando los confetis caen fuera de pantalla
            if (confetis.some(c => c.y < canvas.height)) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Utilidades de formato
     */
    formatearNumero(num) {
        return num.toLocaleString('es-MX');
    }

    formatearMoneda(num) {
        return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /**
     * Inyecta los estilos CSS del modal
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
            }

            .sorteo-header {
                text-align: center;
                padding: 30px 20px;
                background: linear-gradient(135deg, #0F3A7D 0%, #1B5FB8 100%);
                color: white;
                border-radius: 20px 20px 0 0;
            }

            .sorteo-logo-container {
                margin-bottom: 15px;
            }

            .sorteo-logo {
                max-width: 120px;
                height: auto;
                filter: brightness(0) invert(1);
            }

            .sorteo-titulo {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .sorteo-info-principal {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
                border-bottom: 2px solid #e5e7eb;
            }

            .sorteo-nombre {
                font-size: 1.5rem;
                margin: 0 0 10px 0;
                color: #1F2937;
            }

            .sorteo-organizador {
                color: #6B7280;
                margin: 5px 0;
                font-size: 0.95rem;
            }

            .sorteo-fecha-cierre {
                color: #e8553b;
                font-weight: 600;
                margin: 5px 0 0 0;
            }

            .sorteo-agradecimiento {
                padding: 20px;
                background: #fff3cd;
                border-left: 4px solid #FCD34D;
                text-align: center;
                color: #856404;
                font-size: 0.95rem;
                line-height: 1.6;
            }

            .sorteo-scroll-container {
                flex: 1;
                overflow-y: auto;
                padding: 0 20px;
                scroll-behavior: smooth;
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
                margin: 25px 0;
            }

            .sorteo-seccion-titulo {
                font-size: 1.3rem;
                color: #0F3A7D;
                margin: 0 0 15px 0;
                padding-bottom: 10px;
                border-bottom: 2px solid #e5e7eb;
            }

            /* GANADORES PRINCIPALES */
            .sorteo-ganadores-lista {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .sorteo-ganador-card {
                background: linear-gradient(135deg, #f8f9fa 0%, #f0f0f0 100%);
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                transition: transform 0.2s, box-shadow 0.2s;
            }

            .sorteo-ganador-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }

            .ganador-medalla {
                font-size: 2.5rem;
                margin-bottom: 10px;
            }

            .ganador-posicion {
                font-size: 1.3rem;
                font-weight: 700;
                color: #0F3A7D;
                margin-bottom: 10px;
            }

            .ganador-divider {
                height: 2px;
                background: #e8553b;
                margin: 10px 0;
            }

            .ganador-premio {
                font-size: 1.1rem;
                font-weight: 600;
                color: #1F2937;
                margin-bottom: 8px;
            }

            .ganador-numero {
                color: #6B7280;
                font-size: 0.95rem;
                margin-bottom: 12px;
            }

            .ganador-numero strong {
                color: #0F3A7D;
                font-weight: 700;
            }

            .ganador-persona {
                background: white;
                padding: 10px;
                border-radius: 8px;
                margin-top: 10px;
            }

            .ganador-nombre {
                font-size: 1rem;
                font-weight: 600;
                color: #0F3A7D;
            }

            .ganador-ubicacion {
                color: #6B7280;
                font-size: 0.9rem;
                margin-top: 5px;
            }

            /* GANADORES SIMPLES (PRE-SORTEO, RULETAZO) */
            .sorteo-ganador-simple {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 0.95rem;
            }

            .simple-numero strong {
                color: #0F3A7D;
                font-weight: 700;
            }

            .simple-premio {
                color: #e8553b;
                font-weight: 600;
            }

            /* ESTADÍSTICAS */
            .sorteo-stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }

            .stat-item {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }

            .stat-label {
                color: #6B7280;
                font-size: 0.85rem;
                margin-bottom: 5px;
            }

            .stat-value {
                font-size: 1.3rem;
                font-weight: 700;
                color: #0F3A7D;
            }

            /* TRANSPARENCIA */
            .sorteo-transparencia {
                background: white;
                border: 1px solid #10B981;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }

            .transparencia-texto {
                color: #10B981;
                font-weight: 600;
                margin: 0 0 12px 0;
            }

            /* REDES SOCIALES */
            .sorteo-redes {
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .red-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 600;
                text-decoration: none;
                transition: transform 0.2s, box-shadow 0.2s;
                color: white;
            }

            .red-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            .red-btn.whatsapp {
                background: #25D366;
            }

            .red-btn.facebook {
                background: #1877F2;
            }

            .red-btn.instagram {
                background: linear-gradient(45deg, #F77737, #FD1D1D);
            }

            /* BOTONES DE ACCIÓN */
            .sorteo-acciones {
                padding: 20px;
                background: #f8f9fa;
                border-top: 2px solid #e5e7eb;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
                border-radius: 0 0 20px 20px;
            }

            .btn-verificar {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                flex: 1;
                min-width: 200px;
            }

            .btn-verificar:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
            }

            .btn-descargar {
                background: white;
                color: #0F3A7D;
                border: 2px solid #0F3A7D;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
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
                padding: 8px 16px;
                background: #0F3A7D;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 0.9rem;
                text-decoration: none;
                cursor: pointer;
                margin-top: 10px;
            }

            /* ALERTA */
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

            /* RESPONSIVE */
            @media (max-width: 768px) {
                .sorteo-titulo {
                    font-size: 1.8rem;
                }

                .sorteo-nombre {
                    font-size: 1.2rem;
                }

                .sorteo-stats-grid {
                    grid-template-columns: 1fr;
                }

                .sorteo-acciones {
                    flex-direction: column;
                }

                .btn-verificar {
                    min-width: auto;
                }

                .sorteo-redes {
                    gap: 8px;
                }

                .red-btn {
                    flex: 1;
                    min-width: 100px;
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Instancia global
const modalSorteoFinalizado = new ModalSorteoFinalizado();

// Exportar para uso en otros módulos
window.ModalSorteoFinalizado = ModalSorteoFinalizado;
window.modalSorteoFinalizado = modalSorteoFinalizado;
