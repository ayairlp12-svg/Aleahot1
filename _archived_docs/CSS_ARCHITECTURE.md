# 📐 Arquitectura de CSS - Guía de Buenas Prácticas

## ⚠️ PROBLEMAS SOLUCIONADOS

### Problema: CSS Conflictivo en `.efectivo-card` (Producción)
- **Fecha**: 2 de febrero 2026
- **Síntoma**: Las tarjetas de efectivo cambiaban de blanco a violeta al cambiar de pestaña
- **Causa**: Había estilos base conflictivos en dos lugares:
  - `cuentas-pago.html` línea 111: `background: white`
  - `css/styles.css` línea 5615: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Solución Implementada**: Ver sección "Reglas de Arquitectura" abajo

---

## 📋 REGLAS DE ARQUITECTURA CSS

### 1. SEPARACIÓN DE RESPONSABILIDADES

**Regla General:**
- **CSS BASE (páginas específicas)**: Estilos fundamentales van en HTML inline o `<style>` dentro de la página
- **CSS ESPECIALIZADO (styles.css)**: Solo estilos de variantes/especializaciones con `[data-*]`

**Ejemplo Correcto: `.efectivo-card`**

```
cuentas-pago.html (línea ~111):
┌─────────────────────────────────────────┐
│ .efectivo-card {                        │
│   background: white;  ✅ AQUÍ           │
│   border: 1px solid #e0e0e0;           │
│   color: #1a1a1a;                      │
│ }                                       │
└─────────────────────────────────────────┘

css/styles.css (línea ~5615):
┌─────────────────────────────────────────┐
│ .efectivo-card[data-bank="oxxo"] {      │
│   background: linear-gradient(...);     │
│   color: white; ✅ VARIANTE            │
│ }                                       │
│                                         │
│ .efectivo-card[data-bank="walmart"] {   │
│   background: linear-gradient(...);     │
│   color: white;                        │
│ }                                       │
└─────────────────────────────────────────┘
```

### 2. ORDEN DE ESPECIFICIDAD

```
📊 Cascada CSS (de MENOR a MAYOR especificidad):
1. css/styles.css - .elemento (NUNCA aquí para base)
2. cuentas-pago.html - .elemento (SÍ, aquí va la base)
3. cuentas-pago.html - .elemento:hover (local)
4. css/styles.css - .elemento[data-*] (variantes con !important si necesario)
5. Inline styles - style="" (último recurso, solo emergencias)
```

### 3. NOMENCLATURA Y DOCUMENTACIÓN

**Patrón de Nombres:**
- `.elemento` = Estilos base (puede estar en HTML o styles.css, pero preferible HTML)
- `.elemento[data-bank="..."]` = Variantes especializadas (styles.css)
- `.elemento--modifier` = Modificadores (estilos alternativos)
- `.elemento:hover` = Estados interactivos

**Documentación Requerida:**
Cuando agregues estilos de variantes en styles.css, SIEMPRE incluye comentario:

```css
/* ========================================================================
   SECCIÓN: ELEMENTO-NAME
   UBICACIÓN: nombre-pagina.html
   ======================================================================
   NOTA: Estilos base están en HTML. Aquí solo variantes [data-*]
   ======================================================================== */
```

---

## 🔍 CHECKLIST PARA PREVENIR CONFLICTOS

Antes de hacer cambios a CSS, verifica:

- [ ] ¿Hay estilos `.clase` base en AMBOS lugares (HTML y styles.css)?
- [ ] ¿El archivo está usando `!important` innecesariamente?
- [ ] ¿Hay múltiples definiciones del mismo selector?
- [ ] ¿El `overflow`, `display`, `position` están conflictuando?
- [ ] ¿El `background`, `color`, `box-shadow` están duplicados?

**Búsqueda Rápida:**
```bash
# En VS Code - Ctrl+Shift+F (Find in All Files)
# Busca el nombre de la clase en todo el proyecto
# Si aparece en 2+ archivos con estilos conflictivos, ES UN PROBLEMA
```

---

## 📄 PÁGINAS CRÍTICAS CON ESTILOS LOCALES

Estas páginas tienen CSS inline/`<style>` que PRIMA sobre styles.css:

1. **cuentas-pago.html**
   - `.cuenta-card` (línea 104) - Tarjeta de crédito visual
   - `.efectivo-card` (línea 111) - Tarjeta blanca de depósitos
   - Estilos por banco en `[data-bank="..."]` van en styles.css

2. **compra.html**
   - Chequear si hay estilos específicos inline

3. Otras páginas...

---

## 🛠️ CÓMO ARREGLARLO SI VUELVE A PASAR

**Si las tarjetas de efectivo vuelven a cambiar de color:**

1. Abre DevTools (F12 en el navegador)
2. Click derecho en la tarjeta → "Inspect"
3. Busca qué CSS le está aplicando `background: linear-gradient` o color violeta
4. Verifica que NO haya un `.efectivo-card` base (sin `[data-bank]`) en styles.css
5. Si lo hay, ELIMÍNALO de styles.css
6. Los estilos base deben estar SOLO en cuentas-pago.html

---

## 📌 REGLA DE ORO PARA PRODUCCIÓN

> **"Cada clase debería estar definida en EXACTAMENTE UN LUGAR. Las variantes (con `[data-*]` o pseudo-clases) van en styles.css, pero NUNCA los estilos base."**

---

## 📊 TABLA DE REFERENCIA

| Tipo de Estilo | Ubicación Correcta | Usar !important | Ejemplo |
|---|---|---|---|
| Estilos Base | HTML o inline | ❌ No | `.efectivo-card { background: white; }` |
| Variantes | styles.css con [data-*] | ✅ Sí | `.efectivo-card[data-bank="oxxo"]` |
| Hover/Estados | HTML o styles.css | ❌ No | `.elemento:hover { ... }` |
| Responsive | Media queries en styles.css | ❌ No | `@media (max-width: 768px)` |
| Overrides | Casi nunca | ⚠️ Solo si necesario | `color: red !important;` |

---

## ✅ VALIDACIÓN PRE-PRODUCCIÓN

Antes de hacer deploy:

```bash
# 1. Buscar clases duplicadas
grep -r "\.efectivo-card {" .

# 2. Verificar que no hay múltiples background definitions
grep -r "\.efectivo-card" css/ | grep "background:"

# 3. Testear en múltiples navegadores y cambiar pestañas
# 4. Testear en diferentes dispositivos (mobile, tablet, desktop)
# 5. Verificar DevTools - no debe haber conflictos de CSS
```

---

## 🚀 ESTADO ACTUAL (2 de febrero 2026)

✅ **SOLUCIONADO:**
- `.efectivo-card` base está en cuentas-pago.html (blanco)
- `.efectivo-card[data-bank="..."]` está en styles.css (colores)
- Documentación clara añadida en styles.css línea ~5615
- No hay más conflictos de estilos

📝 **MONITOREAR:**
- Si se hacen cambios a `.efectivo-card`, actualizar AMBOS lugares
- Si se agregan nuevas variantes, siempre usar `[data-*]`

