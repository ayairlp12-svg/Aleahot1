/**
 * Web Worker para procesar boletos sin bloquear UI
 * Corre en thread separado, no congela la pantalla
 */

self.onmessage = function(event) {
    const { sold, reserved, action } = event.data;
    
    if (action === 'process') {
        try {
            // Procesar arrays sin bloquear main thread
            const soldSet = new Set(sold.map(Number));
            const reservedSet = new Set(reserved.map(Number));
            
            // Enviar datos procesados de vuelta
            self.postMessage({
                success: true,
                soldSet: Array.from(soldSet),
                reservedSet: Array.from(reservedSet),
                totalProcessed: sold.length + reserved.length
            });
        } catch (error) {
            self.postMessage({
                success: false,
                error: error.message
            });
        }
    }
};
