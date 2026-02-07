# 📖 REFERENCIA RÁPIDA - Sistema de Oportunidades

## ⚡ Architektur de Una Línea
```
[CARGA] window.rifaplusOportunidadesDisponibles (738k números)
    ↓ Polling cada 5s
    ↓ [USER SELECCIONA BOLETOS] 
    ↓ [CARRITO-GLOBAL.JS genera 3 oportunidades/boleto con splice()]
    ↓ [LOCALSTORAGE guarda]
    ↓ [USER CONFIRMA COMPRA]
    ↓ [FLUJO-COMPRA.JS recupera y POST]
    ↓ [BACKEND valida atomically]
    ↓ [UPDATE + auto-replace si necesario]
```

---

## 🔑 Archivos Críticos (Solo 5)

| Archivo | Propósito | Línea Clave |
|---------|----------|-------------|
| `carrito-global.js:762` | ⭐ GENERA oportunidades | `splice()` |
| `flujo-compra.js:271` | 📥 RECUPERA de localStorage | `localStorage ONLY` |
| `compra.js:817` | 🔄 POLLING (5s) | `GET /api/oportunidades/disponibles` |
| `backend/oportunidadesOrdenService.js:28` | ✅ VALIDA atomically | `SELECT + UPDATE` |
| `modal-conflicto-boletos.js` | 🚨 CONFLICTOS | `auto-replacement CON CONSENTIMIENTO` |

---

## ✅ Garantías del Sistema

| Garantía | Mecanismo | Evidencia |
|----------|-----------|-----------|
| **0 duplicados por boleto** | `splice()` en pool global | ST-AA019: 360/360 ✓ ST-AA020: 600/600 ✓ |
| **Consistencia atómica** | `SELECT + UPDATE` en transacción | `Disp:600 Apart/Vend:0` ✓ |
| **Reactividad a cambios** | Polling 5s | Detecta compras de otros usuarios |
| **Auto-recovery** | localStorage fallback | Nunca pierde oportunidades generadas |

---

## 🧹 Lo Que Se Eliminó

**Porqué:**
- ❌ `oportunidades-service.js` → Conflictivo (tenía generador alternativo)
- ❌ `oportunidades-manager.js` → Fallback nunca usado
- ❌ 7 `test-*.js` en backend → Solo para desarrollo
- ❌ 12 `.md` redundantes → Info en ARQUITECTURA_FINAL.md

**Resultado:** Código limpio, sin conflictos, una única verdad (carrito-global.js)

---

## 📊 Estado Actual

```
Total Oportunidades: 750,000 (250000-999999)
Disponibles: 739,657
Usadas: 10,343
Tasa uso: 1.38%
```

---

## 🚀 Para Hacer Deploy

```bash
# 1. Verificar no hay errores
npm run build

# 2. Commit
git add -A
git commit -m "Clean: Arquitectura simplificada"

# 3. Push
git push origin main

# 4. Monitorear logs (24-48h)
# Buscar: "✅ [Background] Oportunidades asignadas: X"
# Esperar: "Apart/Vend:0" (sin reemplazos)
```

---

## 🐛 Debug Rápido

**Si hay duplicados:**
```javascript
// En consola del cliente:
const opp = JSON.parse(localStorage.getItem('rifaplus_oportunidades'));
const unicos = new Set(opp.boletosOcultos).size;
console.log(`Total: ${opp.boletosOcultos.length}, Unicos: ${unicos}`);
// Debe ser igual
```

**Si hay conflicto boletos:**
```javascript
// Backend log buscará:
// "📊 Disp:X Apart/Vend:Y"
// Si Y > 0: Hubo auto-replacements (esperado en alta concurrencia)
```

---

## 📞 Archivos de Referencia

- **ARQUITECTURA_FINAL.md** → Flujo completo + archivo por archivo
- **CHECKLIST_PRODUCCION_FINAL.md** → Validaciones pre-deploy
- **DEPLOYMENT_GUIDE.md** → Pasos para hacer deploy
- **LIMPIEZA_COMPLETADA.md** → Qué se limpió y porqué

---

✅ **Proyecto limpio, modular, y production-ready**

