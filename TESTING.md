# 🧪 Guía Rápida de Testing

## ✅ Verificación Rápida (5 minutos)

### 1. Verificar que servidor está corriendo
```bash
curl -s http://127.0.0.1:5001/health || echo "❌ Servidor no responde"
# Debería responder: {"message":"API RifaPlus - Servidor en funcionamiento"}
```

### 2. Abrir la web
```
Abrir: http://127.0.0.1:3000 (o tu localhost)
✅ Debería ver la página principal sin errores
```

### 3. Test de Orden Normal
**Pasos**:
1. Seleccionar 5 boletos (ej: 1, 2, 3, 4, 5)
2. Ingresar nombre: "Test User"
3. Ingresar WhatsApp: "+5491234567890"
4. Seleccionar estado y ciudad
5. Hacer clic en "Apartar boletos"

**Resultado esperado**:
- ✅ Mensaje "📤 Guardando orden en la base de datos..."
- ✅ Mensaje "✅ ¡Orden guardada exitosamente! Redirigiendo..."
- ✅ Redirecciona a orden-confirmada.html
- ✅ Muestra datos de la orden

**Verificación en BD**:
```bash
psql $DATABASE_URL -c "SELECT numero_orden, cantidad_boletos, nombre_cliente, estado FROM ordenes ORDER BY created_at DESC LIMIT 1;"
# Debería mostrar la orden creada
```

---

## 🔄 Test de Reintentos (Network Offline)

**Pasos**:
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Marcar "Offline"
4. Seleccionar boletos
5. Hacer clic en "Apartar boletos"
6. Esperar a que intente por 1ra vez
7. Desmarcar "Offline"
8. Esperar reintento

**Resultado esperado**:
- ✅ Primer intento falla
- ✅ Mensaje "No se puede conectar al servidor"
- ✅ Se reactiva la conexión
- ✅ Cliente reintenta automáticamente
- ✅ Orden se guarda exitosamente

---

## 🔗 Test de Boletos Duplicados

**Pasos**:
1. **Cliente A**: Selecciona boletos 10-20
2. **Cliente B** (otra pestaña): Selecciona boletos 15-25 (overlap)
3. Cliente A hace clic en "Apartar"
4. Espera respuesta (orden guardada)
5. Cliente B hace clic en "Apartar"

**Resultado esperado**:
- ✅ Cliente A: Orden exitosa
- ✅ Cliente B: Error 409
- ✅ Mensaje: "Estos boletos ya fueron comprados: 15, 16, 17, 18, 19, 20"
- ✅ Cliente B puede seleccionar otros boletos

**Verificación en BD**:
```bash
psql $DATABASE_URL -c "SELECT boletos FROM ordenes WHERE numero_orden IN ('SY-AA027', 'SY-AA028') LIMIT 2;"
# Debería mostrar arrays diferentes sin overlap
```

---

## 🔄 Test de Double-Click (Rage Click)

**Pasos**:
1. Seleccionar boletos
2. Hacer clic en "Apartar boletos"
3. Inmediatamente hacer clic nuevamente (2-3 veces)
4. Observar console

**Resultado esperado**:
- ✅ Primer clic: "🔵 Click en Continuar"
- ✅ Segundo clic: IGNORADO (no sale mensaje)
- ✅ Console muestra: "⚠️ Ya hay una orden en proceso"
- ✅ Se crea solo 1 orden en BD

**Verificación en BD**:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ordenes WHERE nombre_cliente='Test User' AND created_at > NOW() - INTERVAL 1 minute;"
# Debería mostrar 1 (no 2 o 3)
```

---

## 🔴 Test de Error en BD

**Pasos**:
1. Parar PostgreSQL: `psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'yepyep'"`
2. Seleccionar boletos
3. Hacer clic en "Apartar boletos"
4. Observar error

**Resultado esperado**:
- ✅ Reintento 1 falla
- ✅ Reintento 2 falla
- ✅ Reintento 3 falla
- ✅ Error final: "Error al guardar orden [ERR-xxx]"
- ✅ Usuario ve: "Error al guardar orden en la base de datos"

**Verificación en logs**:
```bash
grep "ERR-" /var/log/rifaplus.log
# Debería mostrar el error con stack trace (si dev mode)
```

---

## ⚡ Test de Performance

**Test 1: Órdenes Rápidas**
```bash
for i in {1..10}; do
    curl -s -X POST http://127.0.0.1:5001/api/ordenes \
      -H "Content-Type: application/json" \
      -d '{
        "ordenId":"PERF-'$i'",
        "cliente":{"nombre":"User'$i'","whatsapp":"5491234567890","estado":"Test","ciudad":"Test"},
        "boletos":['$((i+100))','$((i+101))'],
        "totales":{"subtotal":30,"descuento":0,"totalFinal":30},
        "precioUnitario":15
      }' &
done
wait

# Debería completar en <5 segundos
```

**Test 2: Carga Alta (100 órdenes concurrentes)**
```bash
time for i in {1..100}; do
    curl -s -X POST http://127.0.0.1:5001/api/ordenes ... &
done
wait

# Debería completar en <10 segundos
```

---

## 📊 Validaciones en Capas

**Test que todo lo valida**:

### Capa 1: Frontend
```javascript
// Abrir console y ejecutar:
window.guardarOrden() // Sin orden seleccionada

// Resultado esperado:
// ❌ No hay orden para guardar
```

### Capa 2: Validación de Array
```javascript
// Simular boletos inválidos:
localStorage.setItem('rifaplus_boletos', '"no es array"');
// Intentar guardar

// Resultado esperado:
// ❌ Error: los boletos deben ser un array
```

### Capa 3: Validación de Cliente
```javascript
// Simular cliente vacío:
localStorage.setItem('rifaplus_cliente', '{"nombre":""}');
// Intentar guardar

// Resultado esperado:
// ❌ Faltan datos obligatorios: nombre
```

### Capa 4: Validación de Datos Monetarios
```javascript
// Simular total 0:
localStorage.setItem('rifaplus_total', '{"totalFinal":0}');
// Intentar guardar

// Resultado esperado:
// ❌ El total debe ser mayor a 0
```

### Capa 5: Validación Backend
```bash
curl -X POST http://127.0.0.1:5001/api/ordenes \
  -H "Content-Type: application/json" \
  -d '{"cliente":"not an object"}'

# Resultado esperado:
# 400 "Datos del cliente requeridos"
```

---

## 🔍 Debugging Tips

### Ver logs en tiempo real
```bash
tail -f /var/log/rifaplus.log | grep -i "POST /api/ordenes"
```

### Ver una orden específica
```bash
psql $DATABASE_URL -c "SELECT * FROM ordenes WHERE numero_orden='SY-AA027' \gx"
```

### Ver boletos de una orden
```bash
psql $DATABASE_URL -c "SELECT numero, estado, numero_orden FROM boletos_estado WHERE numero_orden='SY-AA027' ORDER BY numero;"
```

### Ver errores de consola del navegador
```
F12 → Console → Buscar "❌"
```

### Ver network requests
```
F12 → Network → Buscar "api/ordenes"
→ Click en request → Response → Ver JSON
```

---

## ✅ Checklist de Validación

- [ ] Orden normal se guarda correctamente
- [ ] Error en BD se reintenta automáticamente
- [ ] Double-click solo crea 1 orden
- [ ] Boletos duplicados se detectan
- [ ] Timeout se maneja correctamente
- [ ] Datos se validan en 5 capas
- [ ] Logs contienen información útil
- [ ] Performance <1s para orden normal
- [ ] Error IDs son únicos y trackables
- [ ] BD no tiene órdenes parciales/corruptas

---

## 🚀 Cuando Todo Pase

```bash
# Cambiar a producción
export NODE_ENV=production
export DATABASE_URL="postgresql://..."
export JWT_SECRET="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"

# Iniciar servidor
pm2 start backend/server.js --name rifaplus
pm2 save

# Verificar
pm2 logs rifaplus
curl -s http://127.0.0.1:5001/health
```

---

*Guía de testing para RifaPlus v1.0.0*

