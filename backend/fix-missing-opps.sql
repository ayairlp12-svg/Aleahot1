INSERT INTO orden_oportunidades (numero_oportunidad, estado, numero_orden, created_at, updated_at)
SELECT i AS numero_oportunidad, 'disponible' AS estado, NULL::text AS numero_orden, NOW(), NOW()
FROM generate_series(250000, 999999) AS i
WHERE NOT EXISTS (
  SELECT 1 FROM orden_oportunidades WHERE numero_oportunidad = i
)
ON CONFLICT (numero_oportunidad) DO NOTHING;

SELECT COUNT(*) as total FROM orden_oportunidades;
