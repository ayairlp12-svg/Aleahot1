#!/bin/bash
# Script para verificar oportunidades en BD

echo "🔍 Verificando oportunidades para orden ST-AA200..."
psql -h localhost -U rifaplus_user -d rifaplus -c "
  SELECT 
    estado, 
    COUNT(*) as total
  FROM orden_oportunidades
  WHERE numero_orden = 'ST-AA200'
  GROUP BY estado;
"

echo ""
echo "📊 Total oportunidades asignadas a ST-AA200:"
psql -h localhost -U rifaplus_user -d rifaplus -c "
  SELECT COUNT(*) as total
  FROM orden_oportunidades
  WHERE numero_orden = 'ST-AA200';
"
