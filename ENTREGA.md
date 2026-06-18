# ENTREGA — Ejercicio OpenSpec

## 1. Evidencia de instalación

```bash
# openspec --version
# (pendiente de ejecutar openspec init)

# ls -R openspec/
# (pendiente tras openspec init)
```

---

## 2. Plantilla de los 3 Pilares

### Micro-tarea elegida
**Validador de emails en Node.js con detección de fraude**

---

### Pilar 1 — Herramienta
| Campo | Detalle |
|-------|---------|
| **Herramienta utilizada** | Cursor (Claude Sonnet 4.5) |
| **Modo** | Agent |
| **Contexto de proyecto** | Repositorio sandbox del ejercicio OpenSpec |

---

### Pilar 2 — Contexto
| Campo | Detalle |
|-------|---------|
| **Archivos abiertos / adjuntos** | `README.md` del repositorio |
| **Información de entorno** | Node.js v24.15.0, macOS |
| **Conocimiento previo aportado** | Patrones de emails fraudulentos (dominios desechables, caracteres engañosos, subdominios excesivos) |

---

### Pilar 3 — Prompt

#### Prompt utilizado (estructura Rol · Contexto · Acción · Criterios · Validación)

```
ROL:
Eres un desarrollador senior de Node.js especializado en seguridad 
y validación de datos.

CONTEXTO:
Estoy construyendo un módulo de validación de emails para una 
aplicación Node.js. El módulo debe detectar no solo si un email 
tiene formato válido, sino también si presenta señales de fraude 
o intento de engaño.

ACCIÓN:
Crea un módulo en Node.js (sin dependencias externas) que:
1. Valide el formato del email con una expresión regular robusta.
2. Detecte emails potencialmente fraudulentos comprobando:
   - Dominios desechables conocidos (mailinator, tempmail, guerrillamail, etc.)
   - Subdominios excesivos (más de 2 niveles).
   - Caracteres engañosos en el dominio (homoglyphs, guiones al inicio/fin).
   - Longitud anormalmente larga en el local-part (>64 caracteres).
   - Múltiples signos "+" o caracteres especiales inusuales.
3. Devuelva un objeto de resultado con: { valid, fraudulent, reasons[] }.

CRITERIOS DE ACEPTACIÓN:
- El código debe funcionar con Node.js v20+ sin instalar paquetes.
- Incluir al menos 10 casos de prueba (emails válidos, inválidos y fraudulentos).
- Cada señal de fraude detectada debe incluir una descripción legible en reasons[].
- El módulo debe exportarse como función para poder integrarse en otros archivos.

VALIDACIÓN:
Al final, muéstrame la salida de ejecutar los casos de prueba con 
`node validator.js` para confirmar que el módulo funciona correctamente.
```

---

### Resultado del prompt

| Campo | Detalle |
|-------|---------|
| **¿Hubo que iterar?** | No — el resultado fue correcto en el primer intento |
| **Calidad de la respuesta** | El modelo generó el módulo completo con los 10 casos de prueba y la salida esperada sin necesidad de ajustes |
| **Observación clave** | La estructura Rol + Contexto + Acción + Criterios + Validación eliminó la ambigüedad y el modelo supo exactamente qué entregar y cómo verificarlo |

---

## 3. Tres observaciones de la exploración

1. **La especificidad en los criterios evita rondas de corrección.** Al definir exactamente qué debe devolver la función (`{ valid, fraudulent, reasons[] }`) y las condiciones mínimas (10 tests, sin dependencias), el modelo no tuvo que adivinar el formato de salida, lo cual eliminó la necesidad de iterar.

2. **El campo "Validación" actúa como test de aceptación automatizado.** Pedir explícitamente que el modelo muestre el output de `node validator.js` forzó al modelo a comprobar mentalmente su propio código antes de entregarlo, reduciendo errores silenciosos.

3. **El rol especializado mejora el tono y el nivel técnico.** Indicar "desarrollador senior especializado en seguridad" hizo que el modelo usara terminología correcta (homoglyphs, local-part, RFC 5321) y tomara decisiones de diseño más defensivas que si se hubiera usado un rol genérico.
