-- ==============================================================
-- DIAGNÓSTICO: Verificar si rango 251025-251088 está marcado incorrectamente
-- ==============================================================

-- 1. Contar números en el rango
SELECT COUNT(*) as total_en_rango
FROM orden_oportunidades
WHERE numero_oportunidad BETWEEN 251025 AND 251088;

-- 2. Ver distribución por estado
SELECT 
  estado,
  COUNT(*) as cantidad
FROM orden_oportunidades
WHERE numero_oportunidad BETWEEN 251025 AND 251088
GROUP BY estado;

-- 3. Ver números específicos (primeros y últimos)
SELECT numero_oportunidad, estado, numero_orden
FROM orden_oportunidades
WHERE numero_oportunidad BETWEEN 251025 AND 251045
ORDER BY numero_oportunidad;

SELECT numero_oportunidad, estado, numero_orden
FROM orden_oportunidades
WHERE numero_oportunidad BETWEEN 251068 AND 251088
ORDER BY numero_oportunidad;

-- ==============================================================
-- SI EL ESTADO ES 'apartado' SIN numero_orden, CORREGIR:
-- ==============================================================

-- CORRECCIÓN: Marcar como disponibles si están como apartado sin orden
UPDATE orden_oportunidades
SET estado = 'disponible', numero_orden = NULL
WHERE numero_oportunidad BETWEEN 251025 AND 251088
  AND estado = 'apartado'
  AND numero_orden IS NULL;

-- Verificar después de la corrección
SELECT COUNT(*) as ahora_disponibles
FROM orden_oportunidades
WHERE numero_oportunidad BETWEEN 251025 AND 251088
  AND estado = 'disponible'
  AND numero_orden IS NULL;
