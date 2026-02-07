# 🔐 CHECKLIST PRE-DEPLOYMENT

## Antes de subir cambios a PRODUCCIÓN, verifica:

### 1️⃣ CSS - Conflictos de Estilos
- [ ] ¿Hay clases `.` duplicadas en HTML inline y styles.css?
- [ ] ¿Estoy usando `!important` sin necesidad?
- [ ] ¿He buscado la clase en TODO el proyecto para conflictos?
- [ ] ¿Los estilos base están en UN SOLO lugar?
- [ ] ¿Las variantes usan `[data-*]` selector?

### 2️⃣ Testing - Validación Visual
- [ ] ¿La página se ve bien en TODAS las pestañas del navegador?
- [ ] ¿Cambié de pestaña y volví? ¿Los estilos se mantienen?
- [ ] ¿Probé en Chrome, Firefox, Safari?
- [ ] ¿Probé en móvil (iPhone, Android)?
- [ ] ¿Probé en tablet (iPad)?
- [ ] ¿Probé en modo oscuro (si aplica)?

### 3️⃣ Páginas Críticas (donde pasó el problema)
- [ ] **cuentas-pago.html**: ¿Las tarjetas de efectivo son blancas? ✅
- [ ] **cuentas-pago.html**: ¿Las tarjetas de banco tienen sus gradientes?
- [ ] **compra.html**: ¿Se ven todas las promociones?
- [ ] **compra.html**: ¿Los bonos se mostran correctamente?

### 4️⃣ Verificación en DevTools
```
Pasos:
1. Abre F12 (DevTools)
2. Click derecho en elemento sospechoso → "Inspect"
3. Mira el panel de CSS a la derecha
4. ¿Hay múltiples definiciones del mismo style?
5. ¿Hay conflictos de especificidad?
6. ¿Hay `!important` innecesarios?
```

### 5️⃣ Búsqueda de Conflictos (VS Code)
```
Ctrl+Shift+F (Find in All Files):
Busca: .clase-sospechosa
¿Aparece en 2+ archivos?
✅ SÍ = Verificar que sea por diseño
❌ NO = Problema, revisa documentación CSS_ARCHITECTURE.md
```

### 6️⃣ Validación de Colores
- [ ] ¿Los colores base están definidos correctamente?
- [ ] ¿No hay gradientes violetas donde no deberían estar?
- [ ] ¿Los hover effects funcionan sin conflictos?

### 7️⃣ Performance
- [ ] ¿Los cambios agregan load time significativo?
- [ ] ¿Hay cascadas CSS innecesarias?
- [ ] ¿Los `!important` que usé son absolutamente necesarios?

### 8️⃣ Documentación
- [ ] ¿Documenté los cambios en CSS_ARCHITECTURE.md?
- [ ] ¿Agregué comentarios explicativos en el CSS?
- [ ] ¿Un nuevo desarrollador entendería dónde están los estilos?

---

## ⚡ CUANDO ALGO SALGA MAL EN PRODUCCIÓN

**Síntoma**: "Los estilos cambian al cambiar de pestaña"

**Diagnóstico Rápido**:
```
1. Abre DevTools → F12
2. Inspecciona el elemento
3. Busca cuál archivo CSS lo está afectando
4. Comprueba si está definido en 2+ lugares
5. Si hay conflicto → Va a CSS_ARCHITECTURE.md
6. Soluciona siguiendo las reglas de separación
```

---

## 📞 REFERENCIAS
- 📖 Ver: `CSS_ARCHITECTURE.md` para más detalles
- 🔍 Problema original: `.efectivo-card` (tarjetas de depósitos en efectivo)
- ✅ Estado: SOLUCIONADO el 2 de febrero de 2026

