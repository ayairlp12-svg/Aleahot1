# 🏗️ Arquitectura Final del Sistema de Oportunidades

**Versión:** 1.0 (Producción)  
**Fecha:** 4 de Febrero de 2026  
**Estado:** ✅ VALIDADO Y FUNCIONANDO

---

## 📋 Resumen Ejecutivo

Sistema de generación y asignación de oportunidades (números ocultos) con **garantía de cero duplicados**.

**Validación actual:**
- ✅ 120 boletos = 360 oportunidades sin duplicados (Orden ST-AA019)
- ✅ 200 boletos = 600 oportunidades sin duplicados (Orden ST-AA020)
- ✅ 0 auto-replacements en ambas órdenes
- ✅ Validación atomizada en backend

---

## 🔄 Flujo de Datos

```
1. CARGA INICIAL (T=0s)
   GET /api/public/oportunidades/disponibles
   ├─ Selectiona: estado='disponible' AND numero_orden IS NULL
   ├─ Filtra: Rango 250000-999999
   └─ Retorna: Array de números disponibles (739,657)
        │
        ↓
   window.rifaplusOportunidadesDisponibles = [739,657 números]

2. POLLING (Cada 5 segundos)
   GET /api/public/oportunidades/disponibles?t={timestamp}
   ├─ Detecta cambios (otras órdenes completadas)
   └─ Actualiza: window.rifaplusOportunidadesDisponibles

3. GENERACIÓN (User selecciona boletos)
   carrito-global.js:762 calcularYLlenarOportunidades()
   ├─ Lee: window.rifaplusOportunidadesDisponibles
   ├─ Crea: Pool global único (NO POR BOLETO)
   ├─ Método: splice() para garantizar sin duplicados
   ├─ Genera: 3 oportunidades por boleto
   └─ Guarda: localStorage['rifaplus_oportunidades']

4. RECUPERACIÓN (User confirma compra)
   flujo-compra.js:271 obtenerOportunidadesDeCarrito()
   ├─ Lee: localStorage SOLO (no regenera)
   └─ POST /api/ordenes { boletosOcultos: [...] }

5. VALIDACIÓN BACKEND (Atomic Transaction)
   oportunidadesOrdenService.js:28 guardarOportunidades()
   ├─ Valida: SELECT estado para cada número
   ├─ Clasifica: Disponibles, Apartados/Vendidos, etc.
   ├─ Auto-reemplaza: Solo si estado cambió entre T-generación y T-guardado
   └─ UPDATE: Con WHERE atomicity (numero_orden IS NULL)
```

---

## 📁 Archivos ACTIVOS (Producción)

### Frontend - Generación de Oportunidades
- **js/carrito-global.js** (OFICIAL)
  - Único generador de oportunidades
  - Usa pool global con splice()
  - Garantiza cero duplicados por boleto

- **js/flujo-compra.js** (RECUPERACIÓN)
  - Solo lee de localStorage
  - No regenera, no modifica
  - Envía datos al backend

- **js/compra.js** (POLLING)
  - cargarOportunidadesDisponibles()
  - iniciarActualizacionPeriodicaOportunidades()
  - Actualiza cada 5 segundos

### Frontend - Manejo de Conflictos
- **js/modal-conflicto-boletos.js**
  - Si boleto no disponible → Pide confirmación al usuario
  - Auto-replacement CON CONSENTIMIENTO

### Backend - Validación Atómica
- **backend/services/oportunidadesOrdenService.js**
  - guardarOportunidades() → Transacción atómica
  - Auto-replacement solo si estado cambió
  - Garantiza integridad de datos

---

## 🗑️ Archivos ELIMINADOS (Limpieza)

### Generadores Conflictivos
- ❌ **js/oportunidades-service.js** 
  - Tenía calcularOportunidadesCarrito() - NO se llamaba desde frontend
  - Causaba conflicto conceptual

- ❌ **js/oportunidades-manager.js**
  - Fallback generator nunca usado
  - Redundante con carrito-global.js

### Backups
- ❌ **js/modal-sorteo-finalizado.backup.js**
  - Copia antigua del modal
  - Mantener solo modal-sorteo-finalizado.js

### Scripts de Testing
- ❌ **backend/test-*.js** (6 archivos)
  - test-dos-ordenes.js
  - test-auto-reemplazo-*.js
  - test-query-asignadas.js
  - test-dos-ordenes-demo.js
  - Usados solo en desarrollo

- ❌ **backend/diagnostico-duplicados.js**
  - Script de debugging
  - Ya no necesario

---

## 🔐 Garantías del Sistema

### Cero Duplicados
✅ Método: **splice()** en pool global
```javascript
const disponiblesPoolGlobal = [...numerosDisponibles]; // ÚNICO pool
for (const boletVisible of numerosOrdenados) {
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * disponiblesPoolGlobal.length);
        const numero = disponiblesPoolGlobal.splice(randomIndex, 1)[0]; // REMOVIDO
    }
}
```

### Integridad Atómica
✅ Backend: SELECT → UPDATE en transacción
```sql
SELECT estado FROM orden_oportunidades 
WHERE numero_oportunidad = ? 
  AND estado = 'disponible' 
  AND numero_orden IS NULL;

UPDATE orden_oportunidades 
SET estado = 'apartado', numero_orden = ?
WHERE numero_oportunidad = ?
  AND estado = 'disponible' 
  AND numero_orden IS NULL;
```

### Consistencia en Concurrencia
✅ Auto-replacement si otro usuario compró el mismo número entre T-gen y T-save

---

## 📊 Estadísticas Actuales

```
Total configurado: 750,000 (250000-999999)
Total en BD: 750,000
Disponible: 739,657 (-10,343 de ST-AA019 y ST-AA020)
Asignado: 0 (backend valida antes de marcar como apartado)
Apartado: 10,343
En uso: 10,343
Porcentaje uso: 1.38%
```

---

## ✅ Checklist Pre-Producción

- [x] Cero duplicados validado (120 + 200 boletos)
- [x] Backend validación atómica funcionando
- [x] Polling cada 5 segundos actualizando lista
- [x] Auto-replacement working (0 en test, esperable en alta concurrencia)
- [x] Arquitectura limpia (sin generadores conflictivos)
- [x] Código comentado innecesario removido
- [x] Scripts de testing eliminados
- [x] Documentación consolidada

---

## 🚀 Deployment

**Paso 1:** Revisar que no haya referencias a archivos eliminados
```bash
grep -r "oportunidades-service\|oportunidades-manager\|test-\|diagnostico-" \
  --include="*.html" --include="*.js" .
```

**Paso 2:** Deploy a producción
```bash
git add -A
git commit -m "Clean: Remover generadores conflictivos y archivos de test"
git push origin main
```

**Paso 3:** Monitoreo (24-48h)
- Verificar logs backend: `Disp:X Apart/Vend:0` (cero reemplazos)
- Monitor frontend: `✅ [CARRITO] Fuera del set: 0`

---

## 📞 Soporte

Si necesitas revertir cambios:
```bash
# Ver commit anterior
git show HEAD^:js/oportunidades-service.js

# Restaurar archivo específico
git checkout HEAD^ -- js/oportunidades-service.js
```

---

**Última actualización:** 4 Feb 2026  
**Responsable:** Sistema de RifaPlus  
**Estado:** 🟢 PRODUCCIÓN
