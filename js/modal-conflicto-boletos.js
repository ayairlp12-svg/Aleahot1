/**
 * ============================================================
 * ARCHIVO: js/modal-conflicto-boletos.js
 * DESCRIPCIÓN: Modal amigable para conflictos de boletos
 * - Muestra boletos que fueron apartados por otros clientes
 * - Ofrece opciones: elegir otros O continuar sin conflictivos
 * - Maneja reintentos inteligentes
 * ============================================================
 */

const ModalConflictoBoletos = {
    
    /**
     * Crear y mostrar modal de conflicto
     * @param {Object} datos - Datos del error de conflicto
     * @returns {Promise<{opcion: string, boletosSeleccionados: Array}>}
     */
    async mostrarModalConflicto(datos) {
        return new Promise((resolve) => {
            // Crear overlay - Estilo consistente con la web
            const overlay = document.createElement('div');
            overlay.id = 'modal-conflicto-overlay';
            overlay.className = 'modal-overlay-conflicto';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(15, 23, 42, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            `;

            // Crear modal - Estilo consistente con la web
            const modal = document.createElement('div');
            modal.className = 'modal-conflicto';
            modal.style.cssText = `
                background: white;
                border-radius: 0.75rem;
                padding: 2.5rem;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
                max-height: 80vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            `;

            const boletosConflictoStr = datos.boletosConflicto.join(', ');
            const boletosDisponiblesStr = datos.boletosDisponibles?.length > 0 
                ? datos.boletosDisponibles.join(', ') 
                : 'ninguno';

            console.log('🔍 ModalConflictoBoletos - Datos recibidos:', {
                boletosConflicto: datos.boletosConflicto,
                boletosDisponibles: datos.boletosDisponibles
            });
            
            // ✅ NOTA: Ya no necesitamos calcular maxDigitos 
            // La función formatearNumeroBoleto() lo hace internamente
            
            // Función para formatear boletos con ceros a la izquierda
            const formatearBoleto = (numero) => {
                // ✅ Usar función centralizada de config.js
                return window.rifaplusConfig.formatearNumeroBoleto(numero);
            };

            let contenido = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h2 style="margin: 0 0 0.75rem 0; color: #ef4444; font-size: 1.5rem; font-weight: 700; font-family: 'Inter', sans-serif;">
                        Boletos No Disponibles
                    </h2>
                    <p style="color: #6b7280; margin: 0.75rem 0 0 0; font-size: 0.95rem; font-family: 'Inter', sans-serif; line-height: 1.6;">
                        ${datos.message}
                    </p>
                </div>

                <div style="background: rgba(239, 68, 68, 0.1); padding: 1.25rem; margin: 1.5rem 0; border-radius: 0.5rem;">
                    <p style="margin: 0; color: #1f2937; font-weight: 600; font-family: 'Inter', sans-serif; font-size: 0.95rem; margin-bottom: 0.75rem;">
                        <strong>${datos.boletosConflicto.length}</strong> boleto(s) acaban de ser apartado(s):
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                        ${datos.boletosConflicto.map(boleto => `
                            <div style="
                                background: #0f172a;
                                border: 2px solid #1f2937;
                                border-radius: 0.5rem;
                                padding: 0.75rem 1rem;
                                min-width: 100px;
                                text-align: center;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <span style="color: white; font-family: 'Courier New', monospace; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.05em;">
                                    ${formatearBoleto(boleto)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // Mostrar boletos disponibles si existen
            if (datos.boletosDisponibles && datos.boletosDisponibles.length > 0) {
                contenido += `
                    <div style="padding: 1.25rem; margin: 1.5rem 0;">
                        <p style="margin: 0; color: #1f2937; font-weight: 600; font-family: 'Inter', sans-serif; font-size: 0.95rem; margin-bottom: 0.75rem;">
                            <strong>${datos.boletosDisponibles.length}</strong> boleto(s) sí están disponibles:
                        </p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            ${datos.boletosDisponibles.map(boleto => `
                                <div style="
                                    background: #0f172a;
                                    border: 2px solid #1f2937;
                                    border-radius: 0.5rem;
                                    padding: 0.75rem 1rem;
                                    min-width: 100px;
                                    text-align: center;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                    <span style="color: white; font-family: 'Courier New', monospace; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.05em;">
                                        ${formatearBoleto(boleto)}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            contenido += `
                <div style="margin-top: 2rem;">
                    <p style="color: #1f2937; font-weight: 600; margin-bottom: 1.25rem; font-family: 'Inter', sans-serif; font-size: 0.95rem;">
                        ¿Qué deseas hacer?
                    </p>
                    <div style="display: grid; gap: 0.75rem;">
                        <button class="btn-conflicto" data-accion="elegir-otros" style="
                            background: rgba(16, 185, 129, 0.15);
                            color: #047857;
                            border: 2px solid #10b981;
                            padding: 1rem;
                            border-radius: 0.5rem;
                            font-size: 0.95rem;
                            font-weight: 600;
                            font-family: 'Inter', sans-serif;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 0.5rem;
                        ">
                            📝 Elegir otros boletos
                        </button>
            `;

            if (datos.boletosDisponibles && datos.boletosDisponibles.length > 0) {
                contenido += `
                    <button class="btn-conflicto" data-accion="continuar-sin-conflicto" style="
                        background: #10b981;
                        color: white;
                        border: 2px solid #059669;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        font-size: 0.95rem;
                        font-weight: 600;
                        font-family: 'Inter', sans-serif;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    ">
                        ✅ Continuar con ${datos.boletosDisponibles.length} boleto(s)
                    </button>
                `;
            }

            contenido += `
                    </div>
                </div>

                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; font-size: 0.85rem; color: #9ca3af; font-family: 'Inter', sans-serif;">
                    <p style="margin: 0; line-height: 1.5;">
                        💡 <strong>Tip:</strong> Los boletos disponibles se apartaron hace unos momentos. 
                        Si esperas, otros clientes también podrían apartarlos.
                    </p>
                </div>
            `;

            modal.innerHTML = contenido;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Agregar estilos dinámicos
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .btn-conflicto {
                    transition: all 0.3s ease !important;
                }
                
                /* Botón "Elegir otros" - Verde claro transparente */
                .btn-conflicto[data-accion="elegir-otros"]:hover {
                    background: rgba(16, 185, 129, 0.25) !important;
                    border-color: #059669 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.15) !important;
                }
                
                .btn-conflicto[data-accion="elegir-otros"]:active {
                    transform: translateY(0) !important;
                    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.1) !important;
                }
                
                /* Botón "Continuar" - Verde completo */
                .btn-conflicto[data-accion="continuar-sin-conflicto"]:hover {
                    background: #059669 !important;
                    border-color: #047857 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3) !important;
                }
                
                .btn-conflicto[data-accion="continuar-sin-conflicto"]:active {
                    transform: translateY(0) !important;
                    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2) !important;
                }
                
                .btn-conflicto:focus {
                    outline: 2px solid #0f172a;
                    outline-offset: 2px;
                }
            `;
            document.head.appendChild(style);

            // Event listeners
            const btns = modal.querySelectorAll('.btn-conflicto');
            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const accion = btn.getAttribute('data-accion');
                    
                    // Remover modal con animación
                    overlay.style.animation = 'fadeIn 0.3s ease reverse';
                    setTimeout(() => {
                        overlay.remove();
                    }, 300);
                    
                    if (accion === 'elegir-otros') {
                        resolve({
                            opcion: 'elegir_otros',
                            boletosSeleccionados: []
                        });
                    } else if (accion === 'continuar-sin-conflicto') {
                        resolve({
                            opcion: 'continuar_sin_conflicto',
                            boletosSeleccionados: datos.boletosDisponibles
                        });
                    }
                });
            });

            // Cerrar si se hace clic fuera
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.animation = 'fadeIn 0.3s ease reverse';
                    setTimeout(() => {
                        overlay.remove();
                    }, 300);
                    resolve({
                        opcion: 'elegir_otros',
                        boletosSeleccionados: []
                    });
                }
            });
        });
    },

    /**
     * Manejar respuesta de conflicto desde el servidor
     * @param {Object} respuestaServidor - Respuesta de POST /api/ordenes
     */
    async manejarConflicto(respuestaServidor) {
        console.log('🔴 Conflicto de boletos detectado:', respuestaServidor);

        // Mostrar modal
        const resultado = await this.mostrarModalConflicto(respuestaServidor);

        console.log('✅ Usuario eligió:', resultado);

        return resultado;
    }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.ModalConflictoBoletos = ModalConflictoBoletos;
}
