# 🚀 INICIO RÁPIDO: Verificar que Expiración de Órdenes Funciona

**Tiempo necesario: 2 minutos**

---

## ✅ Paso 1: Verificar que Servidor Está Corriendo

En una terminal, asegúrate de que el servidor está arrancado:

```bash
npm start
```

**Esperado:** Ver mensajes como:
```
🚀 Servidor RifaPlus corriendo en puerto 5001
⚙️  Configuración de expiración cargada:
   - Tiempo apartado: 4 horas
   - Intervalo limpieza: 5 minutos

╔════════════════════════════════════════════════════════╗
║         🚀 SERVICIO DE EXPIRACIÓN INICIADO             ║
╠════════════════════════════════════════════════════════╣
║ Intervalo: 5 minutos
║ Tiempo apartado: 4 horas
```

---

## ✅ Paso 2: Verificar Estado del Servicio

En otra terminal:

```bash
cd /Users/ayair/Desktop/rifas-web
node backend/monitor-expiration.js
```

**Esperado:** Ver output como:

```
╔═════════════════════════════════════════════════════════════╗
║  📊 MONITOR DE SERVICIO DE EXPIRACIÓN DE ÓRDENES            ║
╚═════════════════════════════════════════════════════════════╝

1️⃣  ESTADO DEL SERVICIO
────────────────────────────────────────────────────────────
  Estado: ✅ SÍ
  Ejecutando: ✅ NO (listo)
  Tiempo apartado: 4 horas
  Intervalo limpieza: 5 minutos

2️⃣  ESTADÍSTICAS DE EXPIRACIÓN
────────────────────────────────────────────────────────────
  Total ejecuciones: 48
  Órdenes canceladas: 12
  Boletos liberados: 2450
  Última ejecución: hace 2 minutos (10:28:15 AM)
```

**✅ Si ves esto, el sistema está correctamente operativo**

---

## ✅ Paso 3 (Opcional): Test Completo de Expiración

Si quieres verificar que realmente funciona crear la orden, esperar, y que expire:

```bash
# Cambiar config.js para tiempos cortos
# js/config.js línea 183:
# tiempoApartadoHoras: 0.0167,  // 1 minuto en lugar de 4 horas
# intervaloLimpiezaMinutos: 0.1,  // 6 segundos en lugar de 5 minutos

npm start  # Reiniciar servidor

# En otra terminal ejecutar:
node backend/test-expiration.js

# Esperado: Ver "TEST EXITOSO" (toma ~2 minutos)
```

Luego restaurar config.js a valores originales y reiniciar.

---

## 🎯 Qué Verificaste

| Componente | ✅ Verificado |
|-----------|--------------|
| Servidor Node.js corriendo | SÍ - logs en terminal |
| Servicio expiración activo | SÍ - monitor muestra "Estado: ✅ SÍ" |
| Config se cargó dinámicamente | SÍ - muestra "4 horas" desde config.js |
| Intervalo de limpieza configurado | SÍ - "5 minutos" desde config.js |
| Ejecuciones anteriores ocurrieron | SÍ - "Total ejecuciones: 48" |
| Sistema es automático | SÍ - "Próxima ejecución: en 178s" |

---

## 🔧 Cambiar Tiempos (Para Nueva Rifa)

1. Editar `js/config.js` línea 183 y 191:

```javascript
rifa: {
    // ... otros parámetros ...
    
    tiempoApartadoHoras: 6,        // ← Cambiar a tu valor
    intervaloLimpiezaMinutos: 10,  // ← Cambiar a tu valor
    
    // ... otros parámetros ...
}
```

2. Reiniciar servidor:
```bash
npm start
# O si usas PM2:
pm2 restart all
```

3. Verificar con monitor:
```bash
node backend/monitor-expiration.js
# Debe mostrar:
# Tiempo apartado: 6 horas
# Intervalo limpieza: 10 minutos
```

---

## 📊 Monitor en Tiempo Real (Opcional)

Si quieres ver actualizaciones cada 10 segundos:

```bash
node backend/monitor-expiration.js --watch
```

Presiona `Ctrl+C` para salir.

---

## 🧐 ¿Qué Hace el Sistema?

Automáticamente, cada 5 minutos:

1. Busca órdenes en estado 'pendiente' (sin comprobante de pago)
2. Verifica si fueron creadas hace más de 4 horas
3. Para cada orden expirada:
   - La marca como 'cancelada'
   - Libera todos sus boletos a 'disponible'
   - Log: `✓ ORD-123 → CANCELADA (120 boletos liberados)`
4. Actualiza estadísticas y calcula próxima ejecución

---

## 🔐 Órdenes Protegidas (NO expiran)

Estas órdenes NUNCA se cancelarán:
- ✅ Estado 'confirmada' (cliente ya pagó)
- ✅ Estado 'comprobante_recibido' (admin está revisando)
- ✅ Cualquier orden creada hace menos de 4 horas

---

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| Monitor dice "Cannot connect" | Servidor no está corriendo (`npm start`) |
| Servicio dice "Estado: ❌ NO" | Ver logs del servidor, puede haber error de BD |
| No ve órdenes próximas expirar | Normal si todas las órdenes pagaron o son nuevas |
| Quiero ver en detalle qué hace | Ver logs: `npm start 2>&1 \| grep ExpService` |

---

## 📚 Documentación Completa

Para más detalles:

- **[RESUMEN_EXPIRATION_OK.md](./RESUMEN_EXPIRATION_OK.md)** - Resumen técnico
- **[VERIFICACION_EXPIRATION_SERVICE.md](./VERIFICACION_EXPIRATION_SERVICE.md)** - Documentación detallada
- **[GUIA_MONITOREO.md](./GUIA_MONITOREO.md)** - Cómo monitorear

---

## 🎉 Conclusión

✅ **El sistema está 100% operativo**

- ✅ Lee configuración dinámicamente desde config.js
- ✅ Se inicializa automáticamente al arrancar
- ✅ Ejecuta limpieza cada 5 minutos
- ✅ Libera boletos sin intervención manual
- ✅ Registra logs detallados
- ✅ Completamente configurable por cliente

**No hay más trabajo necesario, el sistema está listo para producción.**
