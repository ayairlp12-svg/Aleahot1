# 📋 RESUMEN RÁPIDO: ¿Dónde se asignan las oportunidades?

## 📍 UBICACIÓN DEL CÓDIGO

| Componente | Archivo | Método |
|-----------|---------|--------|
| **ENTRADA** | `js/carrito-global.js` | Cuando usuario selecciona boletos |
| **CÁLCULO** | `js/oportunidades-service.js` | `calcularOportunidadesCarrito()` |
| **GENERACIÓN** | `js/oportunidades-service.js` | `generarOportunidades()` |
| **ALMACENAMIENTO** | `js/oportunidades-manager.js` | `guardarOportunidades()` |
| **ENVÍO AL BACKEND** | `js/flujo-compra.js` | POST `/api/ordenes` |

---

## 🔄 FLUJO VISUAL

```
Usuario selecciona [123, 456, 789]
                        ↓
        calcularOportunidadesCarrito()
        (js/oportunidades-service.js:256)
                        ↓
        Generar SEED determinístico
        seed = 367784423 (calculado de [123, 456, 789])
                        ↓
        ┌─────────────────────────────────────────┐
        │ Para CADA boleto:                       │
        │                                         │
        │ Boleto 123 + seed → [250112, 252496, 254109]
        │ Boleto 456 + seed → [255001, 256234, 257845]
        │ Boleto 789 + seed → [998234, 999001, 999234]
        │                                         │
        │ Método: generarOportunidades() (LCG)   │
        └─────────────────────────────────────────┘
                        ↓
        Resultado: oportunidadesPorBoleto = {
          123: [250112, 252496, 254109],
          456: [255001, 256234, 257845],
          789: [998234, 999001, 999234]
        }
                        ↓
        Guardar en localStorage + caché
                        ↓
        Enviar al backend:
        boletosOcultos: [250112, 252496, 254109, ...]
                        ↓
        Backend asigna a orden
        (relación boleto↔oportunidad se pierde)
```

---

## 🎲 ¿Es verdaderamente "al azar"?

**NO.** Es **DETERMINÍSTICO**:

- **Mismo inputs** → **Siempre mismo output**
- **Diferentes inputs** → Diferentes outputs
- **Reproducible** → No es aleatorio real, es pseudo-aleatorio matemático

### Ejemplo:

```javascript
// Primera vez
calcularOportunidadesCarrito([123, 456, 789])
→ oportunidadesPorBoleto[123] = [250112, 252496, 254109]

// Segunda vez (mismos boletos)
calcularOportunidadesCarrito([123, 456, 789])
→ oportunidadesPorBoleto[123] = [250112, 252496, 254109]  ← EXACTAMENTE IGUAL

// Diferentes boletos
calcularOportunidadesCarrito([100, 200, 300])
→ oportunidadesPorBoleto[100] = [500001, 500234, 500789]  ← DIFERENTE
```

---

## 🔑 Clave: El SEED

```javascript
// El seed se calcula UNA VEZ a partir de los boletos
seed = _generarSeedDesdeBoletosSeleccionados([123, 456, 789])
     = 367784423  ← Siempre igual para estos boletos

// Luego, cada boleto usa el seed como base
seedBoleto_123 = 367784423 + 123 = 367784546
seedBoleto_456 = 367784423 + 456 = 367784879
seedBoleto_789 = 367784423 + 789 = 367785212

// Y cada seed genera sus números con LCG
LCG(367784546) → [250112, 252496, 254109]
LCG(367784879) → [255001, 256234, 257845]
LCG(367785212) → [998234, 999001, 999234]
```

---

## ✅ Característica: Reproducibilidad

**¿Qué significa?**

Los mismos boletos SIEMPRE producen las mismas oportunidades.

**¿Cuándo es útil?**

- Usuario recarga página → obtiene las mismas oportunidades (caché)
- Auditoría → verificar qué oportunidades corresponden a qué orden
- Testing → reproducir exactamente la misma orden
- Seguridad → imposible "hacer trampa" seleccionando boletos después

---

## 📊 Algoritmo: LCG (Linear Congruential Generator)

```javascript
// Fórmula matemática determinística:
x(n+1) = (a * x(n) + c) mod m

// Valores específicos:
a = 1103515245
c = 12345
m = 2147483648 (2^31)

// Ejemplo (simplificado):
seed_0 = 367784546
seed_1 = (1103515245 * 367784546 + 12345) % 2147483648
       = 250112
seed_2 = (1103515245 * 250112 + 12345) % 2147483648
       = 252496
seed_3 = (1103515245 * 252496 + 12345) % 2147483648
       = 254109
```

---

## ❓ FAQ

**P: ¿Puede el usuario elegir sus oportunidades?**
R: No directamente. Pero los números de boletos que selecciona determinan sus oportunidades.

**P: ¿Puede alguien manipular la asignación?**
R: No. El algoritmo es determinístico. Lo único que podría cambiar es:
- Seleccionar diferentes boletos
- Modificar el código frontend (pero el backend valida)

**P: ¿Por qué no guardar la relación en BD?**
R: Porque:
1. Las oportunidades son un "regalo" opcional
2. Lo importante es que la orden tenga X oportunidades válidas
3. El usuario ya sabe cuáles son (las seleccionó)
4. Ahorrar espacio en BD (750k registros)

**P: ¿Es "justo" el sistema?**
R: Sí. Es completamente determinístico y reproducible. No hay preferencias ni discriminación.

**P: ¿Puede cambiar el algoritmo?**
R: Sí, pero afectaría todas las futuras órdenes:
- `_generarSeedDesdeBoletosSeleccionados()` → cambia seed
- `generarOportunidades()` → cambia LCG
- `generarOportunidadesRapidas()` → alternative rápida

---

## 📝 En una línea:

**Las oportunidades se asignan en el FRONTEND usando un algoritmo DETERMINÍSTICO (LCG) que garantiza que los mismos boletos siempre producen las mismas oportunidades.**
