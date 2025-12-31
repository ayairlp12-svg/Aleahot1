# 📚 ÍNDICE COMPLETO: Sistema de Expiración de Órdenes

## 🎯 Empezar Aquí

**Si tienes 2 minutos:**
→ Lee [INICIO_RAPIDO_EXPIRATION.md](./INICIO_RAPIDO_EXPIRATION.md)

**Si tienes 5 minutos:**
→ Lee [RESUMEN_EXPIRATION_OK.md](./RESUMEN_EXPIRATION_OK.md)

**Si quieres entender todo:**
→ Lee [ARQUITECTURA_EXPIRATION.md](./ARQUITECTURA_EXPIRATION.md)

---

## 📖 Guías Disponibles

### 1. ⚡ INICIO_RAPIDO_EXPIRATION.md
**Duración: 2 minutos**
- Verificación rápida del sistema
- 3 pasos simples
- Cómo cambiar tiempos para nueva rifa

**Ideal para:** Verificación rápida, primeras pruebas

---

### 2. 📊 RESUMEN_EXPIRATION_OK.md
**Duración: 5 minutos**
- Resumen ejecutivo del estado
- Componentes del sistema
- Cómo usar el monitor
- Troubleshooting rápido

**Ideal para:** Entender qué está hecho, estado general

---

### 3. 🔍 VERIFICACION_EXPIRATION_SERVICE.md
**Duración: 15 minutos**
- Verificación técnica completa
- Lógica de expiración detallada
- Endpoints de monitoreo
- Troubleshooting extenso
- Pruebas manuales

**Ideal para:** Debugging, entender cómo funciona en detalle

---

### 4. 🎛️ GUIA_MONITOREO.md
**Duración: 10 minutos**
- Cómo usar `monitor-expiration.js`
- Interpretar resultados
- Scripts de cron job
- Métricas típicas
- Seguridad

**Ideal para:** Monitoreo continuo, alertas, integración

---

### 5. 📐 ARQUITECTURA_EXPIRATION.md
**Duración: 20 minutos**
- Diagrama de componentes
- Flujo de expiración paso a paso
- Estructura de BD
- Clase OrdenExpirationService
- Casos de uso

**Ideal para:** Entender arquitectura completa, decisiones de diseño

---

### 6. ✅ CHECKLIST_EXPIRATION.md
**Duración: Variable (según cuánto verifies)**
- Verificación inmediata (5 min)
- Verificación detallada (20 min)
- Verificación funcional (30 min)
- Matriz de verificación

**Ideal para:** Garantizar que todo funciona, antes de producción

---

## 🛠️ Scripts Disponibles

### backend/monitor-expiration.js
**Verificar estado del servicio en tiempo real**

```bash
# Verificación única
node backend/monitor-expiration.js

# Monitoreo continuo (cada 10s)
node backend/monitor-expiration.js --watch

# Guardar en archivo
node backend/monitor-expiration.js > monitor.log
```

**Muestra:**
- Estado del servicio (activo/inactivo)
- Últimas ejecuciones
- Órdenes próximas a expirar
- Configuración cargada

---

### backend/test-expiration.js
**Test automático de expiración**

```bash
# Crear orden de prueba, esperar a que expire, verificar cancelación
node backend/test-expiration.js

# Toma ~2 minutos (con timeouts cortos configurados)
```

**Verifica:**
- Orden se crea correctamente
- Se expira después del tiempo
- Boletos se liberan
- Sistema limpia después

---

## 💻 Archivos Modificados

### backend/server.js
- ✅ Línea 25: Importa `config-loader`
- ✅ Línea 57-59: Lee configuración dinámicamente
- ✅ Línea 3107-3142: **NUEVOS** Endpoints de monitoreo público
- ✅ Línea 3993: Inicializa servicio con parámetros

### backend/services/ordenExpirationService.js
- ✅ 384 líneas de código robusto
- ✅ Clase `OrdenExpirationService`
- ✅ Métodos: iniciar, limpiar, liberar, obtener estado

### backend/config-loader.js
- ✅ Extrae `tiempoApartadoHoras` de config.js
- ✅ Extrae `intervaloLimpiezaMinutos` de config.js
- ✅ Prioridad: .env > config.js > defaults

### js/config.js
- ✅ Línea 183: `tiempoApartadoHoras: 4,`
- ✅ Línea 191: `intervaloLimpiezaMinutos: 5,`

---

## 📋 Flujo de Trabajo Recomendado

### 1. Primera Vez (Setup)
```
1. Lee INICIO_RAPIDO_EXPIRATION.md (2 min)
   ↓
2. Ejecuta: npm start
   ↓
3. Ejecuta: node backend/monitor-expiration.js
   ↓
4. Verifica que muestra "Estado: ✅ SÍ"
   ↓
5. ✅ LISTO - Sistema operativo
```

### 2. Entender el Sistema
```
1. Lee ARQUITECTURA_EXPIRATION.md (20 min)
   ↓
2. Revisa código comentado en:
   - backend/services/ordenExpirationService.js
   - backend/config-loader.js
   ↓
3. Lee VERIFICACION_EXPIRATION_SERVICE.md (15 min)
   ↓
4. ✅ Entiendes cómo funciona
```

### 3. Antes de Producción
```
1. Ejecuta CHECKLIST_EXPIRATION.md
   ↓
2. Verifica todos los puntos
   ↓
3. Ejecuta: node backend/test-expiration.js
   ↓
4. ✅ Garantizado que funciona
```

### 4. Monitoreo Continuo
```
1. Lee GUIA_MONITOREO.md (10 min)
   ↓
2. Configura cron job si necesitas alertas
   ↓
3. Ejecuta: node backend/monitor-expiration.js --watch
   ↓
4. ✅ Monitoreo en tiempo real
```

### 5. Nueva Rifa / Cliente
```
1. Copia config.js
   ↓
2. Cambia líneas 183 y 191:
   tiempoApartadoHoras: TU_VALOR
   intervaloLimpiezaMinutos: TU_VALOR
   ↓
3. Reinicia servidor: npm start
   ↓
4. Verifica con monitor: node backend/monitor-expiration.js
   ↓
5. ✅ Nueva rifa con tiempos configurados
```

---

## 🔗 Enlaces Rápidos a Secciones

### Instalación y Setup
- [INICIO_RAPIDO_EXPIRATION.md - Paso 1: Verificar Servidor](./INICIO_RAPIDO_EXPIRATION.md#paso-1-verificar-que-servidor-está-corriendo)
- [INICIO_RAPIDO_EXPIRATION.md - Paso 2: Verificar Estado](./INICIO_RAPIDO_EXPIRATION.md#paso-2-verificar-estado-del-servicio)

### Configuración
- [RESUMEN_EXPIRATION_OK.md - Cambiar Tiempos](./RESUMEN_EXPIRATION_OK.md#-cómo-usar)
- [ARQUITECTURA_EXPIRATION.md - Configuración Dinámica](./ARQUITECTURA_EXPIRATION.md#-configuración-dinámica)

### Monitoreo
- [GUIA_MONITOREO.md - Cómo Usar Monitor](./GUIA_MONITOREO.md#-cómo-usar)
- [GUIA_MONITOREO.md - Troubleshooting](./GUIA_MONITOREO.md#-troubleshooting)

### Comprensión Técnica
- [ARQUITECTURA_EXPIRATION.md - Diagrama Completo](./ARQUITECTURA_EXPIRATION.md#-diagrama-de-componentes)
- [VERIFICACION_EXPIRATION_SERVICE.md - Lógica de Expiración](./VERIFICACION_EXPIRATION_SERVICE.md#🔄-flujo-de-funcionamiento)

### Testing y Validación
- [CHECKLIST_EXPIRATION.md - Verificación Inmediata](./CHECKLIST_EXPIRATION.md#-verificación-inmediata-5-minutos)
- [VERIFICACION_EXPIRATION_SERVICE.md - Prueba Manual](./VERIFICACION_EXPIRATION_SERVICE.md#-prueba-manual-de-expiración)

---

## 🎯 Casos de Uso

### "Quiero saber si funciona"
→ [INICIO_RAPIDO_EXPIRATION.md](./INICIO_RAPIDO_EXPIRATION.md)

### "Quiero cambiar tiempos para nueva rifa"
→ [RESUMEN_EXPIRATION_OK.md - Cambiar Tiempos](./RESUMEN_EXPIRATION_OK.md#-configuración-actual)

### "Quiero monitorear órdenes próximas a expirar"
→ [GUIA_MONITOREO.md](./GUIA_MONITOREO.md)

### "Quiero entender cómo funciona internamente"
→ [ARQUITECTURA_EXPIRATION.md](./ARQUITECTURA_EXPIRATION.md)

### "Tengo un problema, necesito debuggear"
→ [VERIFICACION_EXPIRATION_SERVICE.md - Troubleshooting](./VERIFICACION_EXPIRATION_SERVICE.md#-troubleshooting)

### "Quiero garantizar que todo funciona antes de producción"
→ [CHECKLIST_EXPIRATION.md](./CHECKLIST_EXPIRATION.md)

### "Quiero hacer test de expiración"
→ [VERIFICACION_EXPIRATION_SERVICE.md - Prueba Manual](./VERIFICACION_EXPIRATION_SERVICE.md#-prueba-manual-de-expiración)

---

## 📊 Documentación por Rol

### 👨‍💼 Para el Cliente/Dueño
**Lee en este orden:**
1. [RESUMEN_EXPIRATION_OK.md](./RESUMEN_EXPIRATION_OK.md) - 5 min
2. [GUIA_MONITOREO.md - Métricas Típicas](./GUIA_MONITOREO.md#-métricas-típicas) - 2 min

**Conclusión:** Sistema está 100% operativo, no hay nada que hacer.

---

### 👨‍💻 Para el Developer
**Lee en este orden:**
1. [INICIO_RAPIDO_EXPIRATION.md](./INICIO_RAPIDO_EXPIRATION.md) - 2 min
2. [ARQUITECTURA_EXPIRATION.md](./ARQUITECTURA_EXPIRATION.md) - 20 min
3. [VERIFICACION_EXPIRATION_SERVICE.md](./VERIFICACION_EXPIRATION_SERVICE.md) - 15 min

**Conclusión:** Entiende arquitectura, puedes mantener y extender.

---

### 🛠️ Para DevOps/Admin
**Lee en este orden:**
1. [GUIA_MONITOREO.md](./GUIA_MONITOREO.md) - 10 min
2. [GUIA_MONITOREO.md - Script de Cron](./GUIA_MONITOREO.md#-script-de-ejemplo-cron-job) - 5 min
3. [CHECKLIST_EXPIRATION.md](./CHECKLIST_EXPIRATION.md) - 30 min

**Conclusión:** Puedes monitorear, alertar y garantizar uptime.

---

### 🧪 Para QA/Testing
**Lee en este orden:**
1. [INICIO_RAPIDO_EXPIRATION.md](./INICIO_RAPIDO_EXPIRATION.md) - 2 min
2. [CHECKLIST_EXPIRATION.md](./CHECKLIST_EXPIRATION.md) - 30 min
3. [VERIFICACION_EXPIRATION_SERVICE.md - Prueba Manual](./VERIFICACION_EXPIRATION_SERVICE.md#-prueba-manual-de-expiración) - 10 min

**Conclusión:** Puedes validar que sistema funciona completamente.

---

## 🚀 Quick Start por Escenario

### Escenario 1: Verificación Rápida (2 min)
```bash
npm start
# En otra terminal:
node backend/monitor-expiration.js
# Verifica que muestre "Estado: ✅ SÍ"
```

### Escenario 2: Nueva Rifa (5 min)
```javascript
// 1. Editar js/config.js
tiempoApartadoHoras: 8,      // Tu valor
intervaloLimpiezaMinutos: 15, // Tu valor

// 2. Reiniciar
npm start

// 3. Verificar
node backend/monitor-expiration.js
```

### Escenario 3: Debugging (10 min)
```bash
# Ver logs
npm start 2>&1 | grep ExpService

# Monitor continuo
node backend/monitor-expiration.js --watch

# Ver en detalle
curl http://localhost:5001/api/admin/expiration-status
curl http://localhost:5001/api/admin/expiration-stats
```

### Escenario 4: Test Completo (30 min)
```bash
# Editar config.js con tiempos cortos (1 min en lugar de 4 horas)
npm start
node backend/test-expiration.js
# Esperar ~2 minutos
# Restaurar config.js
npm start
```

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa Troubleshooting:**
   - [VERIFICACION_EXPIRATION_SERVICE.md - Troubleshooting](./VERIFICACION_EXPIRATION_SERVICE.md#-troubleshooting)
   - [GUIA_MONITOREO.md - Troubleshooting](./GUIA_MONITOREO.md#-troubleshooting)

2. **Ejecuta Monitor:**
   ```bash
   node backend/monitor-expiration.js
   ```

3. **Revisa Logs del Servidor:**
   ```bash
   npm start 2>&1 | grep -i "error\|expiration"
   ```

4. **Consulta CHECKLIST:**
   - [CHECKLIST_EXPIRATION.md](./CHECKLIST_EXPIRATION.md)

---

## 📝 Resumen de Documentación

| Documento | Duración | Para Quién | Objetivo |
|-----------|----------|-----------|----------|
| INICIO_RAPIDO | 2 min | Todos | Verificación rápida |
| RESUMEN | 5 min | Todos | Entender estado |
| ARQUITECTURA | 20 min | Developers | Entender diseño |
| GUIA_MONITOREO | 10 min | DevOps | Monitorear |
| VERIFICACION | 15 min | QA/Devs | Debugging |
| CHECKLIST | 30 min | QA/DevOps | Validación |

---

## ✨ Estado Final

```
╔════════════════════════════════════════════════╗
║                                                ║
║   ✅ SISTEMA 100% OPERATIVO                  ║
║   ✅ DOCUMENTACIÓN COMPLETA                  ║
║   ✅ SCRIPTS DE MONITOREO LISTOS             ║
║   ✅ GUÍAS PARA TODOS LOS ROLES              ║
║                                                ║
║   LISTO PARA PRODUCCIÓN                       ║
║                                                ║
╚════════════════════════════════════════════════╝
```

---

**¡Gracias por verificar el sistema! Si tienes dudas, revisa los documentos según tu rol.**
