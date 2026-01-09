/**
 * ============================================================
 * ARCHIVO: js/carrito-global.js
 * DESCRIPCIÓN: Gestión del carrito de compra global
 * Sincroniza selecciones, totales y mantiene estado persistente
 * ÚLTIMA ACTUALIZACIÓN: 2025
 * ============================================================
 */

/* ============================================================ */
/* SECCIÓN 1: INICIALIZACIÓN DEL CARRITO                       */
// Todas las funciones de cálculo de precios están delegadas
// al módulo centralizado calculo-precios.js
// obtenerPrecioDinamico() y calcularDescuentoGlobal() se usan desde allí

/* ============================================================ */

/**
 * Inicializa el carrito cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    inicializarCarritoGlobal();
});

/**
 * inicializarCarritoGlobal - Configura listeners y actualiza estado inicial
 * @returns {void}
 */
function inicializarCarritoGlobal() {
    const carritoNav = document.getElementById('carritoNav');
    const carritoModal = document.getElementById('carritoModal');
    
    // Actualizar el contador inmediatamente al cargar la página
    actualizarContadorCarritoGlobal();
    
    // 🔥 VERIFICAR SI HAY ORDEN ENVIADA Y LIMPIAR CARRITO
    if (localStorage.getItem('rifaplusOrdenEnviada') === 'true') {
        localStorage.removeItem('rifaplusSelectedNumbers');
        localStorage.removeItem('rifaplusOrdenEnviada');
        if (typeof selectedNumbersGlobal !== 'undefined' && selectedNumbersGlobal.clear) {
            selectedNumbersGlobal.clear();
        }
        actualizarContadorCarritoGlobal();
        console.log('✅ Carrito limpiado - Orden enviada correctamente');
    }
    
    if (!carritoNav || !carritoModal) return;

    // Abrir carrito al hacer click en el icono
    carritoNav.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Sincronizar carrito antes de mostrar (en caso de cambios desde otra tab o página)
        if (typeof selectedNumbersGlobal !== 'undefined') {
            const stored = localStorage.getItem('rifaplusSelectedNumbers');
            const storedArray = stored ? JSON.parse(stored) : [];
            // Si hay diferencias, sincronizar
            if (storedArray.length !== selectedNumbersGlobal.size) {
                selectedNumbersGlobal.clear();
                storedArray.forEach(num => selectedNumbersGlobal.add(num));
            }
        }
        
        carritoModal.classList.add('active');
        actualizarVistaCarritoGlobal();
        actualizarContadorCarritoGlobal();
    });

    // Cerrar carrito
    const closeCarrito = document.getElementById('closeCarrito');
    if (closeCarrito) {
        closeCarrito.addEventListener('click', cerrarCarritoGlobal);
    }

    carritoModal.addEventListener('click', function(e) {
        if (e.target === carritoModal) {
            cerrarCarritoGlobal();
        }
    });

    // Botón "Seguir comprando"
    const btnSeguirComprando = document.getElementById('btnSeguirComprando');
    if (btnSeguirComprando) {
        btnSeguirComprando.addEventListener('click', cerrarCarritoGlobal);
    }

    // Botón "Limpiar carrito" - usando event delegation para que funcione en todas partes
    if (carritoModal) {
        carritoModal.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'btnLimpiarCarrito') {
                handleLimpiarCarrito();
            }
        });
    }

    // Botón "Proceder al pago" - usando event delegation
    if (carritoModal) {
        carritoModal.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'btnProcederCarrito') {
                handleProcederAlPago();
            }
        });
    }

    // Tecla Escape para cerrar
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && carritoModal && carritoModal.classList.contains('active')) {
            cerrarCarritoGlobal();
        }
    });

    // Botón "Ir a Comprar" (en carrito vacío) - redirigir a compra.html
    const btnIrAComprar = document.getElementById('btnIrAComprar');
    if (btnIrAComprar) {
        btnIrAComprar.addEventListener('click', function() {
            window.location.href = 'compra.html';
        });
    }
}

function cerrarCarritoGlobal() {
    const carritoModal = document.getElementById('carritoModal');
    if (carritoModal) {
        carritoModal.classList.remove('active');
    }
}

function actualizarVistaCarritoGlobal() {
    const selectedNumbers = obtenerBoletosSelecionados();
    const carritoItems = document.getElementById('carritoItems');
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoLista = document.getElementById('carritoLista');
    let carritoResumen = document.getElementById('carritoResumen');
    let carritoResumenCantidad = document.getElementById('carritoResumenCantidad');
    let carritoResumenDescuento = document.getElementById('carritoResumenDescuento');
    let carritoResumenTotal = document.getElementById('carritoResumenTotal');
    let btnProcederCarrito = document.getElementById('btnProcederCarrito');
    let carritoFooter = document.getElementById('carritoFooter');

    if (!carritoItems || !carritoVacio || !carritoLista) return;

    carritoItems.innerHTML = '';

    if (selectedNumbers.length === 0) {
        carritoVacio.style.display = 'flex';
        carritoLista.style.display = 'none';
        if (carritoResumen) carritoResumen.style.display = 'none';
        // Hide footer elements without removing from DOM
        if (carritoFooter) carritoFooter.style.display = 'none';
        // Mark modal as empty so CSS can hide backgrounds/spacing when needed
        const modalEl = document.querySelector('.modal-carrito');
        if (modalEl && !modalEl.classList.contains('empty-cart')) modalEl.classList.add('empty-cart');
        if (btnProcederCarrito) btnProcederCarrito.disabled = true;
        
        // Actualizar texto del botón para ir a comprar
        if (btnProcederCarrito) {
            btnProcederCarrito.textContent = 'Ir a Comprar';
        }
    
        return;
    }

    carritoVacio.style.display = 'none';
    carritoLista.style.display = 'block';
    // Remove empty marker so footer/background are restored
    const modalEl = document.querySelector('.modal-carrito');
    if (modalEl && modalEl.classList.contains('empty-cart')) modalEl.classList.remove('empty-cart');
    // Ensure footer exists (recreate if it was removed for empty state)
    if (!carritoFooter) {
        createCarritoFooter();
        carritoFooter = document.getElementById('carritoFooter');
        carritoResumen = document.getElementById('carritoResumen');
        carritoResumenCantidad = document.getElementById('carritoResumenCantidad');
        carritoResumenDescuento = document.getElementById('carritoResumenDescuento');
        carritoResumenTotal = document.getElementById('carritoResumenTotal');
        btnProcederCarrito = document.getElementById('btnProcederCarrito');
    }
    // Ensure carritoResumen is displayed as flex
    if (carritoResumen) {
        carritoResumen.style.display = 'flex';
        carritoResumen.style.visibility = 'visible';
        carritoResumen.style.opacity = '1';
    }
    if (carritoFooter) {
        carritoFooter.style.display = 'flex';
        carritoFooter.style.visibility = 'visible';
    }
    if (btnProcederCarrito) {
        btnProcederCarrito.disabled = false;
        btnProcederCarrito.textContent = 'Proceder al pago';
    }

    // Crear lista de boletos ordenados
    const numerosOrdenados = [...selectedNumbers].sort((a, b) => a - b);
    const precioUnitario = obtenerPrecioDinamico();
    
    console.log('%c🛒 [actualizarVistaCarritoGlobal] CARRITO', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
    console.log('  ✓ Números ordenados:', numerosOrdenados);
    console.log('  ✓ Oportunidades config:', window.rifaplusConfig?.rifa?.oportunidades);
    console.log('  ✓ OportunidadesService:', !!window.OportunidadesService);
    
    // ✅ CALCULAR OPORTUNIDADES SI ESTÁN HABILITADAS
    const oportunidadesConfig = window.rifaplusConfig?.rifa?.oportunidades;
    let oportunidadesPorBoleto = {};
    
    if (oportunidadesConfig && oportunidadesConfig.enabled && window.OportunidadesService) {
        try {
            console.log('🎁 [CARRITO] Calculando oportunidades...');
            const resultado = window.OportunidadesService.calcularOportunidadesCarrito(numerosOrdenados);
            oportunidadesPorBoleto = resultado.oportunidadesPorBoleto || {};
            console.log('🎁 [CARRITO] Oportunidades calculadas:', oportunidadesPorBoleto);
        } catch (e) {
            console.error('❌ Error al calcular oportunidades en carrito:', e);
            console.error('Stack:', e.stack);
        }
    } else {
        console.warn('⚠️ [CARRITO] No se pueden calcular oportunidades:', {
            enabled: oportunidadesConfig?.enabled,
            hasService: !!window.OportunidadesService
        });
    }

    // Usar DocumentFragment para agregar todos los items de una sola vez (más rápido)
    const fragment = document.createDocumentFragment();
    const contenedor = document.createElement('div');
    
    numerosOrdenados.forEach(numero => {
        // Obtener oportunidades para este boleto
        const oportunidades = oportunidadesPorBoleto[numero] || [];
        
        console.log(`  ✓ Boleto #${numero} → ${oportunidades.length} oportunidades: ${oportunidades.join(', ')}`);
        
        const itemHtml = `
            <div class="carrito-item" data-numero="${numero}">
                <div class="carrito-item-numero">
                    <span class="carrito-item-numero-text">Boleto #${numero}</span>
                    <span class="carrito-item-numero-precio">$${precioUnitario.toFixed(2)}</span>
                </div>
                <button class="carrito-item-trash-btn" data-numero="${numero}" aria-label="Eliminar boleto ${numero}" title="Eliminar boleto ${numero}">
                    <i class="fas fa-trash carrito-item-trash" aria-hidden="true"></i>
                </button>
            </div>
            ${oportunidades.length > 0 ? `<div class="carrito-item carrito-item-oportunidades-container" data-numero="${numero}">
                <div class="carrito-item-numero" style="flex: 1;">
                    <span class="carrito-item-oportunidades-text" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-check carrito-item-oportunidades-check"></i>
                        <strong>Oportunidades:</strong> ${oportunidades.join(', ')}
                    </span>
                </div>
            </div>` : ''}
        `;
        contenedor.insertAdjacentHTML('beforeend', itemHtml);
    });
    
    // Transferir todos los elementos al fragment
    while (contenedor.firstChild) {
        fragment.appendChild(contenedor.firstChild);
    }
    
    // Agregar todos de una sola vez al DOM
    carritoItems.appendChild(fragment);

    // Añadir event listeners solo al icono de basura por fila
    carritoItems.querySelectorAll('.carrito-item-trash-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const numero = parseInt(this.getAttribute('data-numero'), 10);
            removerBoletoSeleccionado(numero);
            actualizarVistaCarritoGlobal();
        });
    });

    // Actualizar resumen
    const calcTotal = calcularDescuentoGlobal(selectedNumbers.length, precioUnitario);
    if (carritoResumenCantidad) carritoResumenCantidad.textContent = calcTotal.cantidadBoletos;
    const subtotalEl = document.getElementById('carritoResumenSubtotal');
    if (subtotalEl) subtotalEl.textContent = `$${calcTotal.subtotal.toFixed(2)}`;
    if (carritoResumenDescuento) carritoResumenDescuento.textContent = `$${calcTotal.descuentoMonto.toFixed(2)}`;
    if (carritoResumenTotal) carritoResumenTotal.textContent = `$${calcTotal.totalFinal.toFixed(2)}`;

    // Guardar totales actualizados en localStorage para que otras partes del flujo usen valores consistentes
    try {
        localStorage.setItem('rifaplus_total', JSON.stringify({
            subtotal: calcTotal.subtotal,
            descuento: calcTotal.descuentoMonto,
            totalFinal: calcTotal.totalFinal,
            precioUnitario: calcTotal.precioUnitario,
            cantidad: calcTotal.cantidadBoletos
        }));
    } catch (e) {
        console.warn('No se pudo guardar rifaplus_total en localStorage', e);
    }
}

function obtenerBoletosSelecionados() {
    // Si estamos en compra.html, usar el Set global
    if (typeof selectedNumbersGlobal !== 'undefined') {
        // Sincronizar con localStorage (nunca sabemos cuándo puede cambiar en otra tab)
        const stored = localStorage.getItem('rifaplusSelectedNumbers');
        const storedArray = stored ? JSON.parse(stored) : [];
        
        // Si hay diferencia, usar el Set global (es la fuente primaria)
        // pero actualizar localStorage por si acaso
        const currentSet = new Set(Array.from(selectedNumbersGlobal));
        localStorage.setItem('rifaplusSelectedNumbers', JSON.stringify(Array.from(currentSet)));
        
        return Array.from(currentSet);
    }
    
    // En otras páginas, obtener del localStorage
    const stored = localStorage.getItem('rifaplusSelectedNumbers');
    return stored ? JSON.parse(stored) : [];
}

// Creates the footer DOM and attaches required event listeners
function createCarritoFooter() {
    const modal = document.querySelector('.modal-carrito');
    if (!modal) return;
    
    // Check if footer already exists
    let carritoFooter = document.getElementById('carritoFooter');
    if (!carritoFooter) {
        const footerHtml = `
            <div class="modal-carrito-footer" id="carritoFooter">
                <div class="carrito-resumen" id="carritoResumen">
                    <div class="carrito-resumen-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="carrito-resumen-item">
                            <span>Cantidad de boletos:</span>
                            <strong id="carritoResumenCantidad">0</strong>
                        </div>
                        <button class="btn btn-danger btn-sm" id="btnLimpiarCarrito" title="Eliminar todos los boletos" style="padding: 0.5rem 1rem; margin: 0;">
                            Limpiar carrito
                        </button>
                    </div>
                    <div class="carrito-resumen-item">
                        <span>Subtotal:</span>
                        <strong id="carritoResumenSubtotal">$0</strong>
                    </div>
                    <div class="carrito-resumen-item">
                        <span>Descuento:</span>
                        <strong id="carritoResumenDescuento">$0</strong>
                    </div>
                    <div class="carrito-resumen-total">
                        <span>Total:</span>
                        <strong id="carritoResumenTotal">$0</strong>
                    </div>
                </div>
                <div class="carrito-acciones carrito-acciones-bottom">
                    <button class="btn btn-outline" id="btnSeguirComprando">Seguir comprando</button>
                    <button class="btn btn-primary btn-lg" id="btnProcederCarrito" disabled>Proceder al pago</button>
                </div>
            </div>
        `;
        modal.insertAdjacentHTML('beforeend', footerHtml);
    }

    // Attach event listeners for all controls
    const btnSeguir = document.getElementById('btnSeguirComprando');
    if (btnSeguir) {
        btnSeguir.removeEventListener('click', cerrarCarritoGlobal);
        btnSeguir.addEventListener('click', cerrarCarritoGlobal);
    }

    // Attach listener para botón "Limpiar carrito" - Ya se maneja por event delegation en modal
    // const btnLimpiar = document.getElementById('btnLimpiarCarrito');
    // if (btnLimpiar) {
    //     btnLimpiar.removeEventListener('click', handleLimpiarCarrito);
    //     btnLimpiar.addEventListener('click', handleLimpiarCarrito);
    // }
}

// Separar handler para limpiar carrito
/**
 * Limpiar todo el carrito
 * Remueve todos los boletos seleccionados y sincroniza boletera
 */
function handleLimpiarCarrito() {
    if (confirm('¿Estás seguro de que deseas eliminar todos los boletos del carrito?')) {
        // Obtener todos los números antes de limpiar para actualizar boletera
        const numerosAEliminar = (typeof selectedNumbersGlobal !== 'undefined' && selectedNumbersGlobal) 
            ? Array.from(selectedNumbersGlobal) 
            : [];
        
        // Limpiar datos
        localStorage.removeItem('rifaplusSelectedNumbers');
        if (typeof selectedNumbersGlobal !== 'undefined' && selectedNumbersGlobal) {
            selectedNumbersGlobal.clear();
        }
        
        // Desmarcar todos los botones en la boletera (solo si existen)
        // Este código solo se ejecutará en compra.html donde existen los botones .numero-btn
        numerosAEliminar.forEach(numero => {
            const botonNumero = document.querySelector(`.numero-btn[data-numero="${numero}"]`);
            if (botonNumero && botonNumero.classList.contains('selected')) {
                botonNumero.classList.remove('selected');
                botonNumero.style.transform = 'scale(1)';
            }
        });
        
        // Actualizar todas las vistas
        actualizarVistaCarritoGlobal();
        actualizarContadorCarritoGlobal();
        if (window.actualizarResumenCompra) window.actualizarResumenCompra();
        
        rifaplusUtils.showFeedback('✅ Carrito limpiado correctamente', 'success');
    }
}

/**
 * Manejador para botón "Proceder al pago"
 * Abre el modal de contacto o inicia flujo en compra.html
 */
function handleProcederAlPago() {
    // Si ya estamos en compra.html, iniciar el flujo de pago
    if (window.location.pathname.includes('compra.html') || window.location.href.includes('compra.html')) {
        if (typeof iniciarFlujoPago === 'function') {
            iniciarFlujoPago();
        }
        cerrarCarritoGlobal();
    } else {
        // Si estamos en otra página, marcar para iniciar flujo al llegar a compra.html
        localStorage.setItem('rifaplusIniciarFlujoPago', 'true');
        window.location.href = 'compra.html';
    }
}

/**
 * Remover un boleto seleccionado
 * Sincroniza: Set global, localStorage, boletera, carrito y resumen
 * También revierte cambios en resultados de búsqueda si están visibles
 */
function removerBoletoSeleccionado(numero) {
    // Remover del Set global
    if (typeof selectedNumbersGlobal !== 'undefined') {
        selectedNumbersGlobal.delete(numero);
    }
    
    // Remover de localStorage
    let stored = localStorage.getItem('rifaplusSelectedNumbers');
    let numbers = stored ? JSON.parse(stored) : [];
    numbers = numbers.filter(n => n !== numero);
    localStorage.setItem('rifaplusSelectedNumbers', JSON.stringify(numbers));
    
    // Desmarcar en la boletera
    const botonNumero = document.querySelector(`.numero-btn[data-numero="${numero}"]`);
    if (botonNumero && botonNumero.classList.contains('selected')) {
        botonNumero.classList.remove('selected');
        botonNumero.style.transform = 'scale(1)';
    }
    
    // Actualizar resultado de búsqueda si existe
    const resultadosList = document.getElementById('resultadosList');
    if (resultadosList) {
        // Encontrar el item de búsqueda para este número
        const resultadosItems = document.querySelectorAll('.resultado-item');
        resultadosItems.forEach(item => {
            const numeroText = item.textContent;
            if (numeroText.includes(`Boleto #${numero}`)) {
                // Regenerar el HTML del resultado con estado "Disponible"
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 1.5rem;">
                        <div>
                            <span style="font-weight: 600; font-size: 1.1rem; color: var(--text-dark);">Boleto #${numero}</span>
                            <span style="display: block; font-size: 0.85rem; color: var(--text-light);">Estado: <strong style="color: var(--success)">✅ Disponible</strong></span>
                        </div>
                        <button class="btn btn-lo-quiero" data-numero="${numero}" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; transition: var(--transition-fast);">Lo quiero</button>
                    </div>
                `;
                
                // Agregar event listener al botón "Lo quiero"
                const btnLoQuiero = item.querySelector('.btn-lo-quiero');
                if (btnLoQuiero) {
                    btnLoQuiero.addEventListener('click', function() {
                        if (typeof agregarBoletoDirectoCarrito === 'function') {
                            agregarBoletoDirectoCarrito(numero);
                        }
                    });
                }
            }
        });
    }
    
    // Actualizar todas las vistas (carrito, resumen, contador)
    if (window.actualizarVistaCarritoGlobal) window.actualizarVistaCarritoGlobal();
    if (window.actualizarContadorCarritoGlobal) window.actualizarContadorCarritoGlobal();
    if (window.actualizarResumenCompra) window.actualizarResumenCompra();
    
    rifaplusUtils.showFeedback(`✅ Boleto #${numero} removido del carrito`, 'success');
}

/**
 * Agregar un boleto al carrito (sincroniza Set global y localStorage)
 * @param {number} numero - Número del boleto a agregar
 * @returns {boolean} - true si se agregó, false si ya estaba
 */
function agregarBoletoSelecionado(numero) {
    // Si estamos en compra.html, usar el Set global
    if (typeof selectedNumbersGlobal !== 'undefined') {
        if (selectedNumbersGlobal.has(numero)) {
            return false; // Ya está seleccionado
        }
        selectedNumbersGlobal.add(numero);
        sincronizarCarritoAlLocalStorage();
    } else {
        // En otras páginas, usar localStorage
        let stored = localStorage.getItem('rifaplusSelectedNumbers');
        let numbers = stored ? JSON.parse(stored) : [];
        
        if (numbers.includes(numero)) {
            return false; // Ya está seleccionado
        }
        
        numbers.push(numero);
        localStorage.setItem('rifaplusSelectedNumbers', JSON.stringify(numbers));
    }
    
    // Actualizar todas las vistas
    if (window.actualizarVistaCarritoGlobal) window.actualizarVistaCarritoGlobal();
    if (window.actualizarContadorCarritoGlobal) window.actualizarContadorCarritoGlobal();
    if (window.actualizarResumenCompra) window.actualizarResumenCompra();
    
    return true;
}

function calcularDescuentoGlobal(cantidad, precioUnitario = null) {
    // NOTA: Esta función ahora delega al módulo centralizado calculo-precios.js
    // Se mantiene aquí por compatibilidad, pero internamente usa calcularTotalConPromociones
    if (typeof calcularTotalConPromociones === 'function') {
        return calcularTotalConPromociones(cantidad, precioUnitario);
    }
    
    // Fallback si calculo-precios.js no está cargado (no debería pasar)
    console.warn('⚠️ calcularDescuentoGlobal: calculo-precios.js no está cargado');
    precioUnitario = precioUnitario || (window.rifaplusConfig?.rifa?.precioBoleto || 15);
    const subtotal = cantidad * precioUnitario;
    return {
        cantidadBoletos: cantidad,
        precioUnitario: precioUnitario,
        subtotal: subtotal,
        descuentoMonto: 0,
        descuentoPorcentaje: 0,
        totalFinal: subtotal
    };
}

// Función para sincronizar carrito al seleccionar en compra.html
function sincronizarCarritoAlLocalStorage() {
    if (typeof selectedNumbersGlobal !== 'undefined') {
        const numbers = Array.from(selectedNumbersGlobal);
        localStorage.setItem('rifaplusSelectedNumbers', JSON.stringify(numbers));
    }
}

// Actualizar contador del carrito globalmente
function actualizarContadorCarritoGlobal() {
    // 🔥 FUENTE ÚNICA DE VERDAD: localStorage para persistencia cross-tab
    const stored = localStorage.getItem('rifaplusSelectedNumbers');
    const selectedNumbers = stored ? JSON.parse(stored) : [];
    
    // Actualizar el display del contador
    const carritoCount = document.querySelector('.carrito-count');
    if (carritoCount) {
        carritoCount.textContent = selectedNumbers.length;
    }
    
    // Sincronizar selectedNumbersGlobal si existe (en compra.html)
    if (typeof selectedNumbersGlobal !== 'undefined') {
        selectedNumbersGlobal.clear();
        selectedNumbers.forEach(num => selectedNumbersGlobal.add(num));
    }
}

// Exportar funciones globalmente
window.actualizarContadorCarritoGlobal = actualizarContadorCarritoGlobal;
window.actualizarVistaCarritoGlobal = actualizarVistaCarritoGlobal;
window.obtenerBoletosSelecionados = obtenerBoletosSelecionados;
window.agregarBoletoSelecionado = agregarBoletoSelecionado;
window.removerBoletoSeleccionado = removerBoletoSeleccionado;