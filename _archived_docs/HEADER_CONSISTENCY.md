# 📍 HEADER - Guía de Consistencia

## 🔍 PROBLEMA DETECTADO Y SOLUCIONADO (2 febrero 2026)

**Síntoma:** El header cambiadaba de apariencia al navegar entre páginas
- compra.html → header con `position: sticky`
- cuentas-pago.html → header con `position: fixed`
- index.html → header con `position: sticky` (por defecto de styles.css)

**Causa:** CSS inline duplicado en diferentes páginas sobrescribía los estilos globales

**Solución Implementada:** 
- ✅ Removido CSS inline del header en compra.html
- ✅ Removido CSS inline del header en cuentas-pago.html
- ✅ Ahora TODAS las páginas usan los estilos globales de css/styles.css
- ✅ Header consistente en todo el sitio

---

## ✅ DEFINICIÓN GLOBAL DEL HEADER

**Ubicación:** `css/styles.css` línea ~122

```css
.header {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    height: 125px;
    padding: 0;
    box-shadow: 0 12px 40px rgba(15, 18, 24, 0.8);
    position: sticky;        ← ESTA ES LA CONFIGURACIÓN OFICIAL
    top: 0;
    z-index: 100;
    overflow: visible;
}
```

**Características:**
- `position: sticky` → El header se mantiene visible al scrollear pero no bloquea el contenido
- `height: 125px` → Alto consistente
- `z-index: 100` → Siempre encima
- Gradient de colores dinámicos

---

## 🚫 REGLA: NO DUPLICAR EL HEADER CSS

### ❌ INCORRECTO - No hagas esto:
```html
<!-- En compra.html, cuentas-pago.html, etc -->
<style>
    .header {
        position: sticky;      ← NO! Ya está definido en styles.css
        top: 0;
        z-index: 100;
    }
</style>
```

### ✅ CORRECTO - Si necesitas sobreescribir específicamente:
```html
<style>
    /* Si algo DEBE ser diferente, documenta el por qué */
    main.container {
        padding: 2rem 1rem;  ← OK, esto es para main, no para header
    }
</style>
```

---

## 📋 PÁGINAS VERIFICADAS

| Página | Header | Estado | Nota |
|--------|--------|--------|------|
| index.html | `.header` (global) | ✅ OK | Sin CSS inline |
| compra.html | `.header` (global) | ✅ ARREGLADO | Removido CSS duplicado |
| cuentas-pago.html | `.header` (global) | ✅ ARREGLADO | Cambió de fixed a sticky |
| ayuda.html | `.header` (global) | ✅ OK | Sin CSS inline |
| mis-boletos.html | `.header` (global) | ⏳ VERIFICAR | Revisar si tiene duplicado |
| admin-*.html | Diferente | ✅ OK | Tienen su propio header |

---

## 🎯 CHECKLIST PARA NUEVAS PÁGINAS

Cuando crees una nueva página pública:

- [ ] ¿Estoy copiando el HTML del header de otra página?
- [ ] ¿Hay `<style>.header { ... }</style>` en mi HTML?
  - ✅ SÍ → ELIMINA todo el CSS del header
  - ❌ NO → Perfecto, usa el global
- [ ] ¿Necesito un header diferente?
  - ✅ SI → Es para una sección admin, ok tener CSS propio
  - ❌ NO → NUNCA duplicues el header de css/styles.css

---

## 📊 ALTURA DEL HEADER

**Valor Oficial:** `125px`

```
Breakdown:
- Container height: 125px
- Logo: Se centra en esos 125px
- Nav links: Se alinean al centro
- Carrito: Se posiciona a la derecha del centro
```

**Espaciado posterior:**
- `position: sticky` → NO requiere `margin-top` en el contenido
- `position: fixed` → REQUERIRÍA `margin-top: 125px` (no usar)

---

## 🔍 CÓMO VERIFICAR CONSISTENCIA

**En DevTools (F12):**
```
1. Abre una página (ej: index.html)
2. Mide la altura del header: Debe ser 125px
3. Navega a otra página (ej: compra.html)
4. Mide nuevamente: Debe ser EXACTAMENTE 125px
5. Verifica position: Debe ser "sticky" en todas
```

**Si no son iguales:**
→ Hay CSS inline conflictivo
→ Revisa el <style> de esa página
→ Elimina el CSS duplicado

---

## 🛠️ LISTA DE VERIFICACIÓN PRE-DEPLOYMENT

- [ ] ¿Todas las páginas públicas usan `.header` de styles.css?
- [ ] ¿El header tiene altura 125px en todas las páginas?
- [ ] ¿No hay `<style>.header</style>` en páginas públicas?
- [ ] ¿Probé navegando entre 3+ páginas sin ver cambios?
- [ ] ¿El header se queda visible al scrollear (sticky)?
- [ ] ¿El carrito y menú aparecen en el mismo lugar?

---

## 📝 HISTORIAL DE CAMBIOS

**2 de febrero 2026:**
- Removido CSS inline de `.header` en compra.html
- Removido CSS inline de `.header` en cuentas-pago.html
- Cambió de `position: fixed` a `position: sticky` globalmente
- Ajustado `margin-top` en cuentas-pago.html (de 125px a 0)
- Documento creado para prevenir regresiones

