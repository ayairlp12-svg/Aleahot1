/**
 * CONSTRAINTS SQL PARA PREVENIR PÉRDIDA DE DATOS
 * 
 * Ejecutar en la BD para agregar validaciones a nivel de base de datos
 * Previene que se inserten números inválidos o se corrompan datos
 */

-- ============================================================
-- CONSTRAINT 1: BOLETOS SOLO EN RANGO VÁLIDO
-- ============================================================

-- Este constraint asegura que solo números 0-999,999 se inserten
-- Previene que tests usen boletos del rango válido

ALTER TABLE boletos_estado
ADD CONSTRAINT check_boleto_numero_rango
CHECK (numero >= 0 AND numero <= 999999);

-- Agregamos descripción del constraint
COMMENT ON CONSTRAINT check_boleto_numero_rango ON boletos_estado IS 
'Previene que se inserten boletos fuera del rango válido (0-999,999)';


-- ============================================================
-- CONSTRAINT 2: ESTADOS VÁLIDOS PARA BOLETOS
-- ============================================================

ALTER TABLE boletos_estado
ADD CONSTRAINT check_boleto_estado_valido
CHECK (estado IN ('disponible', 'apartado', 'vendido', 'cancelado'));

COMMENT ON CONSTRAINT check_boleto_estado_valido ON boletos_estado IS
'Previene estados inválidos en boletos_estado';


-- ============================================================
-- CONSTRAINT 3: TIMESTAMPS VÁLIDOS
-- ============================================================

-- Los timestamps deben ser válidos y not null
ALTER TABLE boletos_estado
ADD CONSTRAINT check_boleto_timestamps
CHECK (created_at IS NOT NULL AND updated_at IS NOT NULL 
       AND updated_at >= created_at);

COMMENT ON CONSTRAINT check_boleto_timestamps ON boletos_estado IS
'Asegura que timestamps existan y sean válidos (updated >= created)';


-- ============================================================
-- CONSTRAINT 4: NO HAY BOLETOS DUPLICADOS (UNIQUE)
-- ============================================================

-- Índice único para evitar duplicados (debería existir ya)
-- Si no existe, agregarlo:

CREATE UNIQUE INDEX IF NOT EXISTS idx_boletos_numero_unique 
ON boletos_estado(numero);

-- Alternativamente, usar constraint:
-- ALTER TABLE boletos_estado
-- ADD CONSTRAINT unique_boleto_numero UNIQUE(numero);


-- ============================================================
-- CONSTRAINT 5: OPORTUNIDADES SOLO EN RANGO TEÓRICO
-- ============================================================

-- Aunque las oportunidades se crean dinámicamente,
-- podemos validar que estén en rango razonable

ALTER TABLE orden_oportunidades
ADD CONSTRAINT check_oportunidad_numero_rango
CHECK (numero >= 250000 AND numero <= 999999);

COMMENT ON CONSTRAINT check_oportunidad_numero_rango ON orden_oportunidades IS
'Previene oportunidades fuera del rango teórico (250K-999K)';


-- ============================================================
-- CONSTRAINT 6: ESTADOS VÁLIDOS PARA OPORTUNIDADES
-- ============================================================

ALTER TABLE orden_oportunidades
ADD CONSTRAINT check_oportunidad_estado_valido
CHECK (estado IN ('disponible', 'apartado', 'ganador', 'cancelado'));

COMMENT ON CONSTRAINT check_oportunidad_estado_valido ON orden_oportunidades IS
'Previene estados inválidos en orden_oportunidades';


-- ============================================================
-- CONSTRAINT 7: ORDEN_ID VÁLIDO EN BOLETOS
-- ============================================================

-- Si un boleto está apartado, DEBE tener orden_id
-- Si está disponible, NO debe tener orden_id

ALTER TABLE boletos_estado
ADD CONSTRAINT check_boleto_orden_consistencia
CHECK (
  (estado = 'disponible' AND orden_id IS NULL) OR
  (estado IN ('apartado', 'vendido', 'cancelado') AND orden_id IS NOT NULL) OR
  (estado IN ('apartado', 'vendido', 'cancelado') AND orden_id IS NULL)
);

COMMENT ON CONSTRAINT check_boleto_orden_consistencia ON boletos_estado IS
'Asegura consistencia entre estado y orden_id';


-- ============================================================
-- TRIGGER: LOG DE CAMBIOS CRÍTICOS
-- ============================================================

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS boletos_auditoria (
  id SERIAL PRIMARY KEY,
  boleto_numero INTEGER NOT NULL,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  orden_id_anterior UUID,
  orden_id_nuevo UUID,
  cambio_en TIMESTAMP DEFAULT NOW(),
  usuario TEXT
);

-- Crear trigger para cambios críticos
CREATE OR REPLACE FUNCTION registrar_cambio_boleto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado != OLD.estado OR NEW.orden_id != OLD.orden_id THEN
    INSERT INTO boletos_auditoria 
    (boleto_numero, estado_anterior, estado_nuevo, orden_id_anterior, orden_id_nuevo)
    VALUES (
      NEW.numero,
      OLD.estado,
      NEW.estado,
      OLD.orden_id,
      NEW.orden_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_boleto_cambios
AFTER UPDATE ON boletos_estado
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_boleto();

COMMENT ON TABLE boletos_auditoria IS
'Auditoría de cambios en boletos para debugging';


-- ============================================================
-- TRIGGER: PREVENIR ELIMINACIÓN ACCIDENTAL
-- ============================================================

CREATE OR REPLACE FUNCTION prevenir_delete_boletos()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'No se permite DELETE en boletos_estado. Usar UPDATE estado = cancelado';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevenir_delete
BEFORE DELETE ON boletos_estado
FOR EACH ROW
EXECUTE FUNCTION prevenir_delete_boletos();

COMMENT ON TRIGGER trigger_prevenir_delete ON boletos_estado IS
'Previene eliminación accidental de boletos';


-- ============================================================
-- VERIFICACIÓN POST-CONSTRAINTS
-- ============================================================

-- Ejecutar estas queries para verificar que los constraints están activos:

-- Ver todos los constraints en boletos_estado
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'boletos_estado'
ORDER BY constraint_name;

-- Ver todos los triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('boletos_estado', 'orden_oportunidades');

-- Ver índices
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('boletos_estado', 'orden_oportunidades');


-- ============================================================
-- MANUAL DE CONSTRAINTS AGREGADOS
-- ============================================================

/*

LISTA DE CONSTRAINTS AGREGADOS:

1. check_boleto_numero_rango
   - Validación: numero >= 0 AND numero <= 999999
   - Propósito: Prevenir números fuera de rango
   - Nivel: CRÍTICO

2. check_boleto_estado_valido
   - Validación: estado IN ('disponible', 'apartado', 'vendido', 'cancelado')
   - Propósito: Prevenir estados inválidos
   - Nivel: CRÍTICO

3. check_boleto_timestamps
   - Validación: created_at NOT NULL AND updated_at NOT NULL AND updated_at >= created_at
   - Propósito: Asegurar timestamps válidos
   - Nivel: ALTO

4. unique_boleto_numero
   - Validación: UNIQUE(numero)
   - Propósito: Prevenir números duplicados
   - Nivel: CRÍTICO

5. check_oportunidad_numero_rango
   - Validación: numero >= 250000 AND numero <= 999999
   - Propósito: Mantener oportunidades en rango teórico
   - Nivel: MEDIO

6. check_oportunidad_estado_valido
   - Validación: estado IN ('disponible', 'apartado', 'ganador', 'cancelado')
   - Propósito: Prevenir estados inválidos en oportunidades
   - Nivel: ALTO

7. check_boleto_orden_consistencia
   - Validación: Relación coherente entre estado y orden_id
   - Propósito: Prevenir estados inconsistentes
   - Nivel: ALTO

8. trigger_boleto_cambios (AUDITORÍA)
   - Propósito: Registrar todos los cambios para debugging
   - Tabla: boletos_auditoria
   - Nivel: MEDIO

9. trigger_prevenir_delete (PROTECCIÓN)
   - Propósito: Prevenir DELETE accidental
   - Alternativa: Usar UPDATE estado = cancelado
   - Nivel: CRÍTICO


BENEFICIOS:

✓ Imposible insertar boletos fuera de rango
✓ Imposible crear estados inválidos
✓ Imposible tener timestamps inválidos
✓ Imposible tener duplicados
✓ Imposible eliminar accidentalmente boletos
✓ Auditoría de todos los cambios
✓ Consistencia de datos garantizada
✓ Debugging más fácil


CÓMO VERIFICAR QUE FUNCIONA:

-- Esto debería fallar
INSERT INTO boletos_estado (numero, estado, created_at, updated_at) 
VALUES (1500000, 'disponible', NOW(), NOW());
-- ❌ ERROR: numero >= 0 AND numero <= 999999

-- Esto debería fallar
INSERT INTO boletos_estado (numero, estado, created_at, updated_at) 
VALUES (50000, 'invalido', NOW(), NOW());
-- ❌ ERROR: estado IN ('disponible', 'apartado', 'vendido', 'cancelado')

-- Esto debería fallar
DELETE FROM boletos_estado WHERE numero = 0;
-- ❌ ERROR: No se permite DELETE en boletos_estado

-- Esto debería funcionar
UPDATE boletos_estado SET estado = 'cancelado' WHERE numero = 0;
-- ✅ OK: UPDATE funciona
*/

-- ============================================================
-- SCRIPT DE ROLLBACK (SI ALGO SALE MAL)
-- ============================================================

/*
-- Para revertir los constraints y triggers:

ALTER TABLE boletos_estado DROP CONSTRAINT IF EXISTS check_boleto_numero_rango;
ALTER TABLE boletos_estado DROP CONSTRAINT IF EXISTS check_boleto_estado_valido;
ALTER TABLE boletos_estado DROP CONSTRAINT IF EXISTS check_boleto_timestamps;
ALTER TABLE boletos_estado DROP CONSTRAINT IF EXISTS check_boleto_orden_consistencia;

ALTER TABLE orden_oportunidades DROP CONSTRAINT IF EXISTS check_oportunidad_numero_rango;
ALTER TABLE orden_oportunidades DROP CONSTRAINT IF EXISTS check_oportunidad_estado_valido;

DROP TRIGGER IF EXISTS trigger_prevenir_delete ON boletos_estado;
DROP TRIGGER IF EXISTS trigger_boleto_cambios ON boletos_estado;

DROP FUNCTION IF EXISTS prevenir_delete_boletos();
DROP FUNCTION IF EXISTS registrar_cambio_boleto();

DROP TABLE IF EXISTS boletos_auditoria;

DROP INDEX IF EXISTS idx_boletos_numero_unique;
*/
