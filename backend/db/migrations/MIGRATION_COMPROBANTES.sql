-- Migración alternativa: Si la tabla ordenes ya existe en producción
-- Ejecutar este script para agregar las columnas faltantes (PostgreSQL)

-- 1. Agregar columna comprobante_path si no existe
ALTER TABLE ordenes 
ADD COLUMN IF NOT EXISTS comprobante_path VARCHAR(255) NULL;

-- 2. Agregar índice en telefono_cliente para búsquedas rápidas por WhatsApp
CREATE INDEX IF NOT EXISTS idx_ordenes_telefono_cliente ON ordenes(telefono_cliente);

-- 3. Documentación de la tabla ordenes
-- Tabla: ordenes
-- Descripción: ordenes de rifas con detalles de boletos y totales
-- 
-- Columnas:
-- - id: ID único (PK)
-- - numero_orden: ID único de la orden (ej: RIFA-001)
-- - cantidad_boletos: número de boletos comprados
-- - precio_unitario: precio por boleto
-- - subtotal: cantidad_boletos * precio_unitario
-- - descuento: descuento aplicado (ej: compra 10+)
-- - total: subtotal - descuento
-- - nombre_cliente: nombre completo del cliente
-- - telefono_cliente: número de WhatsApp del cliente
-- - metodo_pago: método de pago (transferencia, efectivo, tarjeta)
-- - detalles_pago: información adicional (número de transferencia, referencia, etc.)
-- - estado: estado de la orden (pendiente, comprobante_recibido, confirmada, cancelada)
-- - boletos: array JSONB con números de boletos asignados
-- - notas: notas internas del sistema o del admin
-- - comprobante_path: ruta relativa del comprobante subido (comprobantes/RIFA-001_1234567890.pdf)
-- - created_at: fecha de creación de la orden (UTC)
-- - updated_at: fecha de última actualización (UTC)
