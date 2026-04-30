# Guía Rápida - Formulario Diagnóstico Completo

## Inicio Rápido (5 minutos)

### 1. Desplegar Formulario

**Opción A: Local (para testing)**
```bash
cd /tmp/ACP-FRESH2
python3 -m http.server 8000
# Abrir: http://localhost:8000/formulario-diagnostico-completo.html
```

**Opción B: Reemplazar en Netlify**
```bash
# En repo de Netlify
cp formulario-diagnostico-completo.html public/index.html
git add .
git commit -m "Actualizar formulario con campos dinámicos"
git push origin main
```

**Opción C: Servidor Node.js existente**
```javascript
// En server.js línea 35
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'formulario-diagnostico-completo.html'));
});
```

### 2. Verificar Funcionalidad

Abrir en navegador y:
1. ✅ Ver página carga sin errores (consola vacía)
2. ✅ Seleccionar un sector → aparecen campos dinámicos
3. ✅ Seleccionar "Otro" en rubro → aparece campo texto
4. ✅ Llenar formulario completo y enviar
5. ✅ Ver mensaje de éxito

**Listo en 5 minutos!** 🚀

---

## Estructura Rápida

### Secciones del Formulario
```
1. Información Personal (4 campos)
2. Información Empresarial (sector + dinámico)
3. Campos Operacionales (generados dinámicamente)
4. Información Financiera (4 campos)
5. Estrategia y Canales (3 campos)
6. Desafío Principal (dropdown)
7. Asesor y Plan (selector + radio)
```

### Campos Condicionales
- **Sector "Otro"** → campo texto para especificar
- **Desafío "Otro"** → campo texto para especificar

### Campos Dinámicos Automáticos
```javascript
Sector seleccionado → Genera 2 campos operacionales específicos
- Servicios Profesionales: tarifa + equipo
- Comercio: inventario + rotación
- Servicios Terreno: combustible + flota
- Construcción: proyectos + costo
- Gastronomía: covers + ticket
- Salud/Belleza: citas + servicios
- Tecnología: equipo + MRR
- Educación: estudiantes + instructores
- Manufactura: capacidad + materia prima
```

---

## Modificaciones Comunes

### Cambiar Precios de Planes

Buscar en HTML y reemplazar:
```html
<!-- Pricing Banner (línea ~85) -->
<span class="price">$99.990</span>  <!-- Cambiar aquí -->
<span class="price">$299.990</span> <!-- Y aquí -->

<!-- Plan Labels (línea ~240) -->
<div class="plan-price">$99.990</div>  <!-- Básico -->
<div class="plan-price">$299.990</div> <!-- Premium -->
```

### Agregar Nuevo Sector

En la sección `OPERATIONAL_FIELDS_MAP` (línea ~320):

```javascript
// 1. Agregar opción en HTML (antes de cierre de select)
<option value="mi_sector">Mi Sector</option>

// 2. Agregar mapeo en JavaScript
mi_sector: [
    { 
        key: 'campo1', 
        label: 'Mi Campo 1 (unidad)',
        type: 'number',
        required: true,
        placeholder: 'Ej: 100'
    },
    {
        key: 'campo2',
        label: 'Mi Campo 2 (unidad)',
        type: 'number',
        required: true,
        placeholder: 'Ej: 50'
    }
]
```

### Cambiar Opciones de Desafío

En HTML (línea ~205):
```html
<select id="main_challenge" name="main_challenge" required>
    <option value="">-- Selecciona un desafío --</option>
    <option value="opcion1">Mi Opción 1</option>
    <option value="opcion2">Mi Opción 2</option>
    <!-- etc -->
    <option value="otro">Otro (especificar)</option>
</select>
```

### Cambiar Colores de Marca

En CSS (línea ~10-20):
```css
:root {
    --primary-dark: #1a2d3e;    /* Azul primario */
    --accent-gold: #d4a574;      /* Oro/dorado */
    --error-color: #e74c3c;      /* Rojo error */
    --success-color: #27ae60;    /* Verde éxito */
    /* Cambiar según necesidad */
}
```

### Agregar Campo Obligatorio

Asegurarse de:
1. Agregar `required` en input/select
2. Agregar validación en `validateForm()` si es custom
3. Agregar error message div con clase `.error-message`
4. Agregar en lista `requiredFields` en backend

---

## Debugging Rápido

### Formulario No Envía

**Problema:** Click en enviar no hace nada

**Solución:**
```javascript
// En DevTools Console:
document.getElementById('diagnosticForm').addEventListener('submit', (e) => {
    console.log('Submit event:', e);
    console.log('Form valid:', document.getElementById('diagnosticForm').checkValidity());
});
```

### Campos Operacionales No Aparecen

**Problema:** Selecciono sector pero no veo campos

**Solución:**
```javascript
// En DevTools Console:
const sector = document.getElementById('sector').value;
console.log('Sector seleccionado:', sector);
console.log('Mapeo existe?:', OPERATIONAL_FIELDS_MAP[sector]);
```

### Backend No Recibe Datos

**Problema:** Envío falla con error 400

**Solución:**
```javascript
// Verificar estructura antes de enviar
const form = document.getElementById('diagnosticForm');
const formData = new FormData(form);
for (let [key, value] of formData.entries()) {
    console.log(key, ':', value);
}
```

### Validación Demasiado Estricta

**Problema:** Campos que deberían ser opcionales marcan error

**Solución:** En `validateForm()`, buscar el campo y cambiar:
```javascript
if (element.id === 'mi_campo_opcional') {
    // No validar este campo
    return;
}
```

---

## Integración Backend

### Endpoint Esperado

```
POST /api/submit-lead
Content-Type: application/x-www-form-urlencoded

name=Juan&email=juan@test.cl&...&operational_fields={"key":"value"}
```

### Campos Esperados

```javascript
{
    // Personal
    name,           // string, required
    email,          // string, required, email válido
    phone,          // string, required
    company,        // string, required

    // Empresa
    sector,         // string, required (uno de los valores)
    sector_other,   // string, required si sector === 'otro'

    // Financiero
    monthly_sales,  // number, required
    margin,         // number, required
    active_clients, // number, required
    top_costs,      // string, required

    // Estrategia
    main_channel,   // string, required
    main_problem,   // string, required
    goal_6m,        // string, required

    // Desafío
    main_challenge,       // string, required
    main_challenge_other, // string, required si main_challenge === 'otro'

    // Asesor y Plan
    advisor_type,   // string, required (contador, asesor, empresa)
    plan,           // string, required ('basico' o 'premium')

    // Operacionales
    operational_fields: {  // JSON string en POST
        key1: value1,
        key2: value2
    }
}
```

### Validaciones Backend Recomendadas

```javascript
// En server.js /api/submit-lead
const requiredFields = [
    'name', 'email', 'phone', 'company',
    'sector', 'monthly_sales', 'margin', 'active_clients', 'top_costs',
    'main_channel', 'main_problem', 'goal_6m',
    'main_challenge', 'advisor_type', 'plan'
];

// Sector personalizado
if (req.body.sector === 'otro' && !req.body.sector_other) {
    return res.status(400).json({ error: 'Sector personalizado requerido' });
}

// Desafío personalizado
if (req.body.main_challenge === 'otro' && !req.body.main_challenge_other) {
    return res.status(400).json({ error: 'Desafío personalizado requerido' });
}

// Campos operacionales
const opFields = JSON.parse(req.body.operational_fields || '{}');
const expectedFields = OPERATIONAL_FIELDS_MAP[req.body.sector] || [];
for (const field of expectedFields) {
    if (field.required && !opFields[field.key]) {
        return res.status(400).json({ error: `Campo operacional faltante: ${field.label}` });
    }
}
```

---

## Performance

### Tamaño del Archivo
- HTML: ~55 KB (incluyendo CSS e inline JS)
- Carga rápida en conexiones lentas
- No requiere librerías externas (vanilla JS)

### Optimizaciones Aplicadas
- CSS Grid/Flexbox (no floats)
- Event listeners en root (no event delegation heavy)
- Minimal DOM manipulation
- CSS variables para theming rápido

### Mejoras Posibles
- Minificar HTML/CSS/JS
- Agregar service worker para offline
- Lazy load si se expande mucho
- Agregar error tracking (Sentry)

---

## Seguridad

### Implementado
- ✅ HTML5 input validation
- ✅ Client-side email regex validation
- ✅ Required field checks
- ✅ No localStorage de datos sensibles
- ✅ POST (no GET con parámetros)

### Recomendado en Backend
- ✅ Server-side validation de todos los campos
- ✅ Rate limiting en `/api/submit-lead`
- ✅ CORS configurado correctamente
- ✅ Sanitización de input (XSS prevention)
- ✅ SQL injection prevention (si usa DB)

---

## Responsive Design

### Breakpoints
- Mobile: < 600px → 1 columna
- Tablet: 600px - 1024px → responsive
- Desktop: > 1024px → 2 columnas

### Tamaños Base
```css
max-width: 700px       /* Container */
padding: 1.5rem        /* Respeta espacios */
gap: 1rem              /* Entre columnas */
```

### Testing en Devices
```bash
# Chrome DevTools
F12 → Toggle device toolbar (Ctrl+Shift+M)
- iPhone SE (375px)
- iPad (768px)
- Desktop (1920px)
```

---

## Troubleshooting Rápido

| Problema | Causa | Solución |
|----------|-------|----------|
| Form no envía | Validación falla silenciosamente | Check console errors |
| Campos dinámicos no aparecen | Sector no seleccionado | Seleccionar sector en dropdown |
| Layout roto en mobile | CSS Grid no responsive | Check breakpoints en media query |
| Error "require is not defined" | Código Node.js en navegador | Asegurar que ES modules correctas |
| CORS error | Backend headers | Agregar `cors()` en server.js |
| Data no recibida | form-urlencoded issue | Usar URLSearchParams en fetch |

---

## FAQ Técnicas

**P: ¿Puedo cambiar el idioma a inglés?**
R: Sí, reemplazar todos los strings en HTML. Toma ~30 min.

**P: ¿Funciona en IE11?**
R: ~70%. Cambiar fetch a XMLHttpRequest para IE11 support.

**P: ¿Puedo usar con WordPress?**
R: Sí, poner en shortcode o insertar como iframe.

**P: ¿Cómo integro con Zapier?**
R: Backend puede webhookear a Zapier en `/api/submit-lead`.

**P: ¿Puedo guardar como borrador?**
R: Sí, agregar localStorage:
```javascript
form.addEventListener('change', () => {
    localStorage.setItem('form_draft', JSON.stringify(collectFormData()));
});
```

---

## Links Útiles

- Documentación completa: `FORMULARIO_COMPLETO_DOCUMENTACION.md`
- Casos de test: `TEST_CASES_FORMULARIO.md`
- Configuración dinámico: `config-form-dynamics.js`
- Backend validation: `server.js` línea 60+

---

**Última actualización:** 30 Abril 2026
**Versión:** 1.0
**Estado:** Production-Ready ✅
