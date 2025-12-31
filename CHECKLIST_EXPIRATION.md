# ✅ CHECKLIST: Verificación del Sistema de Expiración

## 🎯 Verificación Inmediata (5 minutos)

### 1. Servidor Arrancando

```bash
npm start
```

**Checklist:**
- [ ] Mensaje: "🚀 Servidor RifaPlus corriendo en puerto 5001"
- [ ] Mensaje: "⚙️  Configuración de expiración cargada:"
- [ ] Muestra: "Tiempo apartado: 4 horas"
- [ ] Muestra: "Intervalo limpieza: 5 minutos"
- [ ] Mensaje: "🚀 SERVICIO DE EXPIRACIÓN INICIADO"
- [ ] No hay errores en la consola

**✅ Si todo marcado → Servidor OK**

---

### 2. Monitor Estado

```bash
node backend/monitor-expiration.js
```

**Checklist:**
- [ ] Conecta sin error al servidor
- [ ] Muestra "Estado: ✅ SÍ"
- [ ] Muestra "Ejecutando: ✅ NO (listo)"
- [ ] Tiempo apartado = "4 horas"
- [ ] Intervalo limpieza = "5 minutos"
- [ ] Muestra "Total ejecuciones: X" (algún número)
- [ ] Muestra "Última ejecución: hace X minutos"
- [ ] Muestra "Próxima ejecución: en XXXs"

**✅ Si todo marcado → Monitor OK**

---

### 3. Configuración Dinámica

**Archivo:** `js/config.js`

**Checklist:**
- [ ] Línea 183: `tiempoApartadoHoras: 4,` existe
- [ ] Línea 191: `intervaloLimpiezaMinutos: 5,` existe
- [ ] Monitor muestra estos valores (no hardcoded)
- [ ] Cambiar valor en config.js y reiniciar = monitor muestra nuevo valor

**✅ Si todo marcado → Config OK**

---

### 4. Base de Datos

**Checklist:**
- [ ] Tabla `ordenes` existe
- [ ] Tabla `boletos_estado` existe
- [ ] Hay órdenes en estado 'pendiente' (si quieres verlas expirar)

**Verificar:**
```bash
# En tu cliente PostgreSQL
SELECT COUNT(*) FROM ordenes WHERE estado='pendiente';
SELECT COUNT(*) FROM boletos_estado WHERE estado='reservado';
```

**✅ Si tablas existen → BD OK**

---

## 🔍 Verificación Detallada (20 minutos)

### 5. Servicio Se Inicializa Correctamente

**Archivo:** `backend/server.js`

**Checklist:**
- [ ] Línea 25: Importa `config-loader`
- [ ] Línea 57: Lee `obtenerConfigExpiracion()`
- [ ] Línea 58-59: Asigna `TIEMPO_APARTADO_HORAS` y `INTERVALO_LIMPIEZA_MINUTOS`
- [ ] Línea 3993: Llama `ordenExpirationService.iniciar()`

**Ver en código:**
```bash
grep -n "TIEMPO_APARTADO_HORAS\|INTERVALO_LIMPIEZA" backend/server.js
```

**✅ Si todos presentes → Inicialización OK**

---

### 6. Servicio de Expiración Implementado

**Archivo:** `backend/services/ordenExpirationService.js`

**Checklist:**
- [ ] Clase `OrdenExpirationService` existe
- [ ] Constructor inicializa con defaults
- [ ] Método `iniciar()` crea setInterval
- [ ] Método `limpiarOrdenesExpiradas()` busca ordenes pendientes
- [ ] Método `liberarOrden()` actualiza estado y boletos
- [ ] Método `obtenerEstado()` devuelve estadísticas
- [ ] Flag `isExecuting` previene concurrencia

**Ver métodos:**
```bash
grep "^\s*async \|^\s*iniciar\|^\s*detener" backend/services/ordenExpirationService.js
```

**✅ Si todos métodos presentes → Servicio OK**

---

### 7. Config Loader Lee config.js

**Archivo:** `backend/config-loader.js`

**Checklist:**
- [ ] Función `cargarConfigJavaScript()` extrae sección `rifa`
- [ ] Busca `tiempoApartadoHoras` con regex
- [ ] Busca `intervaloLimpiezaMinutos` con regex
- [ ] Función `obtenerConfigExpiracion()` retorna objeto
- [ ] Prioridad: .env > config.js > defaults

**Ver estructura:**
```bash
head -50 backend/config-loader.js | grep -A2 "tiempoApartadoHoras\|intervaloLimpiezaMinutos"
```

**✅ Si todo OK → Config Loader OK**

---

### 8. Endpoints de Monitoreo Nuevos

**Archivo:** `backend/server.js` (líneas 3107-3142)

**Checklist:**
- [ ] Endpoint `GET /api/admin/expiration-status` existe
- [ ] Endpoint `GET /api/admin/expiration-stats` existe
- [ ] NO requieren autenticación JWT
- [ ] Llaman a `ordenExpirationService.obtenerEstado()`
- [ ] Llaman a `ordenExpirationService.obtenerEstadisticas()`

**Verificar en código:**
```bash
grep -n "/api/admin/expiration-" backend/server.js
```

**✅ Si ambos presentes → Endpoints OK**

---

## 🧪 Verificación Funcional (10-30 minutos)

### 9. Limpieza Ejecuta Cada 5 Minutos

**Prueba:**
1. Arranca servidor: `npm start`
2. Monitorea: `node backend/monitor-expiration.js --watch`
3. Espera 5 minutos
4. Verifica: Campo "Última ejecución" se actualiza cada 5 min

**Esperado:**
```
Última ejecución: hace 0 minutos (10:35:15 AM)
Próxima ejecución: en 300s (10:40:15 AM)

[Esperar 5 minutos]

Última ejecución: hace 0 minutos (10:40:15 AM)
Próxima ejecución: en 300s (10:45:15 AM)
```

**✅ Si se actualiza cada 5 min → Ejecución OK**

---

### 10. Órdenes Expiradas Se Cancelan

**Verificación Manual:**

1. Editar `js/config.js` línea 183:
   ```javascript
   tiempoApartadoHoras: 0.0167,  // 1 minuto
   intervaloLimpiezaMinutos: 0.1,  // 6 segundos
   ```

2. Reiniciar servidor: `npm start`

3. Crear orden de prueba (sin pagar):
   ```bash
   # Via API o directamente en BD
   INSERT INTO ordenes (numero_orden, email_cliente, estado, boletos, created_at)
   VALUES ('TEST-001', 'test@test.com', 'pendiente', '["999","998"]', NOW());
   ```

4. Marcar boletos como reservados:
   ```sql
   UPDATE boletos_estado 
   SET estado='reservado', numero_orden='TEST-001'
   WHERE numero IN ('999', '998');
   ```

5. Esperar 70 segundos

6. Verificar cancelación:
   ```sql
   SELECT estado FROM ordenes WHERE numero_orden='TEST-001';
   -- Debe devolver: 'cancelada'
   
   SELECT estado FROM boletos_estado WHERE numero IN ('999','998');
   -- Deben devolver: 'disponible'
   ```

7. Restaurar config:
   ```javascript
   tiempoApartadoHoras: 4,
   intervaloLimpiezaMinutos: 5,
   ```

8. Reiniciar: `npm start`

**✅ Si orden se canceló y boletos se liberaron → Expiración OK**

---

### 11. Órdenes Protegidas NO Expiran

**Verificación:**

1. Crear orden con estado 'comprobante_recibido':
   ```sql
   INSERT INTO ordenes (numero_orden, email_cliente, estado, boletos, created_at)
   VALUES ('PROT-001', 'test@test.com', 'comprobante_recibido', '["997","996"]', NOW() - INTERVAL '5 hours');
   ```

2. Ejecutar limpieza manualmente:
   ```bash
   curl -X POST http://localhost:5001/api/admin/ordenes-expiradas/limpiar \
     -H "Authorization: Bearer YOUR_JWT"
   ```

3. Verificar que NO se canceló:
   ```sql
   SELECT estado FROM ordenes WHERE numero_orden='PROT-001';
   -- Debe devolver: 'comprobante_recibido' (NO CAMBIÓ)
   ```

**✅ Si orden no cambió → Protección OK**

---

## 📊 Verificación de Rendimiento

### 12. Performance Aceptable

**Checklist:**
- [ ] Limpieza toma < 1 segundo
- [ ] No ve timeout de BD (timeout = 10 segundos)
- [ ] Monitor responde en < 500ms
- [ ] Logs son claros y sin errores

**Verificar en logs:**
```bash
npm start 2>&1 | grep "Duración:"
# Debe mostrar: Duración: 0.45s (menor a 1s)
```

**✅ Si todo < 1s → Performance OK**

---

## 🔐 Verificación de Seguridad

### 13. Transacciones Atómicas

**Checklist:**
- [ ] Si error al actualizar orden → no libera boletos
- [ ] Si error al liberar boletos → orden no se cancela
- [ ] Usa `db.transaction()` para garantizar consistencia
- [ ] Rollback automático si hay error

**Ver en código:**
```bash
grep -A10 "await db.transaction" backend/services/ordenExpirationService.js
```

**✅ Si usa transactions → Seguridad OK**

---

### 14. Prevención de Concurrencia

**Checklist:**
- [ ] Flag `isExecuting` previene ejecuciones simultáneas
- [ ] Si limpieza en progreso → nueva ejecución se salta
- [ ] Logs muestran "Ya hay una limpieza en progreso" si intenta ejecutar 2 veces

**Ver en código:**
```bash
grep -B2 -A2 "isExecuting" backend/services/ordenExpirationService.js | head -10
```

**✅ Si tiene flag isExecuting → Concurrencia OK**

---

## 📝 Verificación de Documentación

### 15. Documentación Completa

**Archivos creados:**
- [ ] `INICIO_RAPIDO_EXPIRATION.md` - Guía rápida (2 min)
- [ ] `RESUMEN_EXPIRATION_OK.md` - Resumen ejecutivo
- [ ] `VERIFICACION_EXPIRATION_SERVICE.md` - Documentación técnica
- [ ] `GUIA_MONITOREO.md` - Cómo usar monitor
- [ ] `ARQUITECTURA_EXPIRATION.md` - Arquitectura visual

**Scripts creados:**
- [ ] `backend/monitor-expiration.js` - Monitor Node.js
- [ ] `backend/test-expiration.js` - Script de test

**Código comentado:**
- [ ] `backend/services/ordenExpirationService.js` - 384 líneas
- [ ] `backend/config-loader.js` - Extrae config dinámicamente

**✅ Si todos archivos presentes → Documentación OK**

---

## 🎯 Resumen Final

### ✅ CRÍTICO (Debe pasar)
- [ ] Servidor arranca sin errores
- [ ] Monitor muestra "Estado: ✅ SÍ"
- [ ] Se ejecuta cada 5 minutos
- [ ] Lee config dinámicamente de config.js

### ✅ IMPORTANTE (Debe pasar)
- [ ] Órdenes expiradas se cancelan
- [ ] Boletos se liberan a 'disponible'
- [ ] Órdenes protegidas NO expiran
- [ ] Transacciones son atómicas

### ✅ ADICIONAL (Bueno verificar)
- [ ] Performance < 1 segundo
- [ ] Prevención de concurrencia
- [ ] Logs claros y detallados
- [ ] Documentación completa

---

## 📋 Matriz de Verificación

| Componente | Crítico | Status | Notas |
|-----------|---------|--------|-------|
| Servidor arranca | ✅ | [ ] | Debe ver logs de expiración |
| Monitor funciona | ✅ | [ ] | Conexión a server.js |
| Config dinámica | ✅ | [ ] | Lee de js/config.js |
| Limpieza ejecuta | ✅ | [ ] | Cada 5 minutos |
| Órdenes expiran | ✅ | [ ] | > 4 horas sin pago |
| Boletos se liberan | ✅ | [ ] | vuelven a 'disponible' |
| Protección funciona | ✅ | [ ] | NO expira comprobante_recibido |
| Transacciones OK | ⚠️  | [ ] | Atomicidad garantizada |
| Performance OK | ⚠️  | [ ] | < 1 segundo |
| Documentación | ⚠️  | [ ] | Completa y clara |

---

## 🚀 Resultado Final

```
┌────────────────────────────────────────────┐
│                                            │
│   TODOS LOS PUNTOS VERIFICADOS ✅         │
│                                            │
│   Sistema 100% Operativo                  │
│   Listo para Producción                   │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🆘 Si Algo Falla

**Paso 1:** Ver logs del servidor
```bash
npm start 2>&1 | grep -i "error\|expiration"
```

**Paso 2:** Ejecutar monitor
```bash
node backend/monitor-expiration.js
```

**Paso 3:** Revisar documentación
- `VERIFICACION_EXPIRATION_SERVICE.md` - Troubleshooting
- `GUIA_MONITOREO.md` - Soluciones comunes

**Paso 4:** Si aún no funciona
- Revisar que BD está accesible
- Revisar que config.js tiene valores
- Revisar que no hay errores SQL en logs

---

**¡Espero que todo pase! ✅**
