# 🔍 DIAGNÓSTICO: Carga de Oportunidades

## Qué se cambió

### ✅ CAMBIO 1: Agregué función de carga en main.js
**Archivo:** `js/main.js` (líneas 102-187)

```javascript
cargarOportunidadesDisponibles() // Nueva función IIFE
```

Esta función:
- Intenta cargar primero desde **localStorage** (caché 10 min)
- Si no hay caché, hace **fetch** a `/api/public/oportunidades/disponibles`
- **Establece:**
  - `window.rifaplusOportunidadesDisponibles` = array de números
  - `window.rifaplusOportunidadesLoaded = true` = marca de listo
- Dispara evento `oportunidadesListas` para otro código si lo necesita

---

## Ver en qué estado está

### 1. Verificar que el servidor está corriendo (puerto 5001)
```bash
cd /Users/ayair/Desktop/rifas-web/backend
npm start
# o si npm falla:
node server.js
```

### 2. Verificar que el endpoint devuelve datos
Abrir en navegador o terminal:
```
http://localhost:5001/api/public/oportunidades/disponibles
```

Debería devolver algo like:
```json
{
  "success": true,
  "disponibles": [250000, 250001, 250002, ...],
  "cantidad": 750000,
  "rango": { "inicio": 250000, "fin": 999999 },
  "timestamp": 1234567890
}
```

### 3. Verificar en DevTools del navegador
1. Abrir **consola** (F12)
2. Buscar logs de `[main]`:
   - ✅ `✅ Oportunidades cargadas: XXX disponibles` = OK
   - ⚠️  `⚠️ Error fetch oportunidades` = problema con backend
   - ⚠️  `✅ Oportunidades desde caché` = usando datos viejos

3. Ver variables globales:
```javascript
console.log(window.rifaplusOportunidadesLoaded)     // ← debe ser true
console.log(window.rifaplusOportunidadesDisponibles.length) // ← debe ser > 0
```

---

## Si el error persiste (todavía vea warnings del carrito)

### Causa 1: Base de datos vacía
**Necesita:** Inicializar la tabla `orden_oportunidades` con números disponibles

```bash
cd /Users/ayair/Desktop/rifas-web/backend
# Ver si existe la tabla
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orden_oportunidades WHERE estado='disponible';"

# Si está vacía, inicializar
node seed-oportunidades-750k.js  # o similar
```

### Causa 2: Backend desconectado
Si `node server.js` falla:
1. Ver si PostgreSQL está corriendo
2. Revisar variables de entorno (.env)
3. Revisar conexión a base de datos

### Causa 3: Puerto incorrecto
Si cambió el puerto, actualizar:
```javascript
// js/config.js línea 615
backend: {
    puerto: 5001,  // ← cambiar aquí si es necesario
    ...
}
```

---

## ✅ Validación: Deberá ver

En la consola del navegador (F12 → Console):
```
[main] Cargando oportunidades disponibles...
[main] ✅ Oportunidades cargadas: 750000 disponibles
```

Posteriormente desaparecerá el warning:
```
⚠️ [CARRITO] Oportunidades aún no cargadas, reintentando en 500ms...
```

---

## Git commit
Esta solución fue agregada en main.js. Puede hacer commit después de verificar:
```bash
git add js/main.js
git commit -m "🔧 Fix: Cargar oportunidades disponibles al iniciar página"
```
