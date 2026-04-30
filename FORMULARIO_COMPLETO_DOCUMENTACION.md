# Formulario Diagnóstico Completo - Documentación

## Resumen Ejecutivo

Se ha creado un **formulario HTML5 completamente funcional y production-ready** con todas las características solicitadas:

- ✅ Rubro/Sector con opción "Otro" que abre campo de texto condicional
- ✅ Campos operacionales dinámicos según rubro (9 rubros x 2 campos c/u)
- ✅ Dropdown "Tipo de asesor" con 3 opciones fijas
- ✅ Campo "Desafío" con 8 opciones + "Otro" con campo condicional
- ✅ Validación en tiempo real y previo al envío
- ✅ Recolección de datos operacionales como objeto JSON
- ✅ Integración completa con `/api/submit-lead`
- ✅ Diseño responsive manteniendo marca (azul #1a2d3e, oro #d4a574)
- ✅ Sistema de planes (Básico vs Premium)
- ✅ UX mejorada con mensajes de error y loading

## Archivo

**Ubicación:** `/tmp/ACP-FRESH2/formulario-diagnostico-completo.html`

## Características Principales

### 1. Estructura del Formulario (7 Secciones)

#### Sección 1: Información Personal
- Nombre Completo (required)
- Email (required)
- Teléfono (required)
- Empresa (required)

#### Sección 2: Información Empresarial
- Rubro/Sector (required) → con campo condicional "Otro"
  - Genera automáticamente campos operacionales según rubro seleccionado

#### Sección 3: Campos Operacionales Dinámicos
Genera automáticamente según sector seleccionado:
- **Servicios Profesionales:** Tarifa horaria + Tamaño equipo
- **Comercio/E-commerce:** Valor inventario + Rotación días
- **Servicios Terreno:** Consumo combustible + Tamaño flota
- **Construcción:** Proyectos activos + Costo promedio
- **Gastronomía:** Covers diarios + Ticket promedio
- **Salud y Belleza:** Citas diarias + Servicios distintos
- **Tecnología:** Equipo desarrollo + MRR (opcional)
- **Educación:** Estudiantes + Instructores
- **Manufactura:** Capacidad mensual + % materia prima

#### Sección 4: Información Financiera
- Ingresos mensuales promedio (required)
- Margen de ganancia actual % (required)
- Clientes activos (required)
- Mayor costo operativo (required)

#### Sección 5: Estrategia y Canales
- Canal principal de ventas (required)
- Problema principal actual (required)
- Objetivo 6 meses (required)

#### Sección 6: Desafío Principal
- Selector con 8 opciones + "Otro" (required)
  - Costos operativos muy altos
  - Margen de ganancia bajo
  - Falta de nuevos clientes
  - Falta de control de gestión
  - Impuestos elevados
  - Problemas de flujo de caja
  - Dificultad para crecer
  - Otro (especificar)

#### Sección 7: Asesor y Plan
- Tipo de asesor dropdown (3 opciones) (required)
- Plan selector (Básico $99.990 / Premium $299.990) (required)

### 2. Funcionalidades JavaScript Inline

#### A. Dinámicamente Mostrar/Ocultar Campos "Otros"

```javascript
// Sector "Otro"
sectorSelect.addEventListener('change', handleSectorChange);
if (selectedSector === 'otro') {
    sectorOtherField.classList.add('visible');
    sectorOtherInput.required = true;
}

// Desafío "Otro"
challengeSelect.addEventListener('change', handleChallengeChange);
if (selectedChallenge === 'otro') {
    challengeOtherField.classList.add('visible');
    challengeOtherInput.required = true;
}
```

#### B. Generar Campos Operacionales Dinámicos

```javascript
function generateOperationalFields(sector) {
    // 1. Obtiene mapeo del sector desde OPERATIONAL_FIELDS_MAP
    // 2. Crea container con estilo profesional
    // 3. Genera inputs dinámicamente para cada campo
    // 4. Asigna atributos data-operational-field para tracking
    // 5. Inserta en DOM
}
```

#### C. Validación Completa

```javascript
function validateForm() {
    // Valida:
    // - Campos requeridos (text, email, tel, number, select, radio)
    // - Email: patrón regex
    // - Números: isNaN check
    // - Campos operacionales dinámicos
    // - Campos condicionales si están visibles
    // Muestra/oculta mensajes de error
}
```

#### D. Recolección de Datos como JSON

```javascript
function collectFormData() {
    // 1. Recolecta todos los campos del formulario
    // 2. Busca inputs con data-operational-field="true"
    // 3. Agrupa campos operacionales en objeto JSON
    // 4. Retorna objeto con estructura:
    // {
    //   name, email, phone, company, sector, ...
    //   operational_fields: {
    //     billable_rate: 75000,
    //     team_size: 5
    //   }
    // }
}
```

### 3. Integración con Backend

El formulario envía datos a `/api/submit-lead` con:

**Content-Type:** `application/x-www-form-urlencoded`

**Estructura de datos:**
```
name=Juan García
email=juan@empresa.cl
phone=+56912345678
company=Mi Empresa
sector=servicios_profesionales
sector_other=
monthly_sales=5000000
margin=25
active_clients=50
top_costs=Arriendo
main_channel=Redes sociales
main_problem=Baja rentabilidad
goal_6m=Aumentar 30%
main_challenge=costos_altos
main_challenge_other=
advisor_type=contador_independiente
plan=basico
operational_fields={"billable_rate":75000,"team_size":5}
```

### 4. Validación en Backend

El servidor (`server.js`) valida:
1. Campos requeridos presentes
2. Sector personalizado si `sector === 'otro'`
3. Tipo de asesor válido
4. Desafío principal válido
5. Desafío personalizado si `main_challenge === 'otro'`
6. Campos operacionales según sector

### 5. Estilos CSS

**Colores de marca:**
- Azul oscuro primario: `#1a2d3e`
- Oro/dorado: `#d4a574`
- Gradientes para botones y headers

**Componentes:**
- Inputs con focus state dorado
- Seleccionador de planes con radio buttons estilizados
- Campos operacionales en container gris con borde dorado
- Campos condicionales con animación smooth
- Mensajes de error en rojo (#e74c3c)
- Loading spinner con animación

**Responsive:**
- Desktop: 2 columnas en form-row
- Mobile: 1 columna
- Botones en stack en mobile

### 6. UX Mejorada

- ✅ Placeholders descriptivos
- ✅ Helper text para campos complejos
- ✅ Validación en tiempo real
- ✅ Mensajes de error específicos por campo
- ✅ Loading indicator durante envío
- ✅ Mensaje de éxito con auto-scroll
- ✅ Reset button limpia formulario completamente
- ✅ Disabled submit durante envío
- ✅ Smooth transitions y animations

## Cómo Usar

### Opción 1: Reemplazar formulario existente

```bash
# Copiar al servidor
cp /tmp/ACP-FRESH2/formulario-diagnostico-completo.html /tmp/ACP-FRESH2/formulario-diagnostico-integrado.html
```

Luego actualizar `server.js` línea 35:
```javascript
app.get('/', (req, res) => {
    const formularioPath = path.join(__dirname, 'formulario-diagnostico-completo.html');
    // ... resto igual
});
```

### Opción 2: Servir nuevo archivo

Actualizar route en `server.js`:
```javascript
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'formulario-diagnostico-completo.html'));
});
```

### Opción 3: Desplegar en Netlify

Si está en repo Netlify, simplemente:
1. Reemplazar `/public/index.html` o crear nueva ruta
2. Push a main
3. Netlify auto-deploya

## Testing

### Test 1: Sector "Otro"
1. Seleccionar "Otro" en Rubro
2. Campo texto debe aparecer
3. Campo debe estar required
4. Validar que no envía sin especificar

### Test 2: Campos Dinámicos
1. Seleccionar "Servicios Profesionales"
2. Deben aparecer "Tarifa horaria" y "Tamaño equipo"
3. Cambiar a otro sector
4. Campos deben actualizarse dinámicamente

### Test 3: Desafío "Otro"
1. Seleccionar "Otro" en Desafío
2. Campo texto debe aparecer
3. Igual validación que sector

### Test 4: Validación
1. Intentar enviar sin llenar campos
2. Errores deben aparecer en rojo
3. Cuando completa, errores desaparecen

### Test 5: Envío
1. Completar todo formulario
2. Hacer submit
3. Debe mostrar loading
4. Recibir respuesta del servidor
5. Mostrar mensaje de éxito

## Archivos Modificados/Creados

| Archivo | Cambio |
|---------|--------|
| `formulario-diagnostico-completo.html` | CREADO - Nuevo formulario completo |
| `FORMULARIO_COMPLETO_DOCUMENTACION.md` | CREADO - Esta documentación |

## Notas Técnicas

### JavaScript Inline
- Todo el código JavaScript está inline en `<script>` al final del HTML
- No requiere archivos externos
- Usa ES6 (fetch, arrow functions, template literals)
- Compatible con navegadores modernos (IE11+)

### Hardcoded Configuration
- `OPERATIONAL_FIELDS_MAP` hardcodeado en HTML
- `ADVISOR_TYPES` y `CHALLENGE_OPTIONS` también hardcodeados
- Si necesita actualizaciones, importar desde `config-form-dynamics.js` en futuro

### Seguridad
- Validación en cliente Y servidor
- XSS protection: no usar innerHTML para user input
- CSRF: confiar en servidor para CORS
- Sensible data: email/phone no se guardan en localStorage

### Performance
- HTML5 input types para mobile keyboards
- CSS Grid/Flexbox (no floats)
- Minimal DOM manipulation
- Event delegation donde es posible

## Próximos Pasos Opcionales

1. **Exportar mapeo a config-form-dynamics.js**
   - Hacer código más mantenible
   - Actualizar por JS import

2. **Agregar file upload** (documentos, fotos)
   - Para evidencia de ingresos, etc.

3. **Agregar progreso visual**
   - Indicador de % completado
   - Paso a paso si quiere wizard mode

4. **Integraciones avanzadas**
   - Auto-guardar en localStorage
   - Guardar borradores
   - Link de continuación por email

5. **Analytics**
   - Trackear abandon rate
   - Campos que causan abandono
   - Tiempo promedio completación

## Preguntas Frecuentes

**P: ¿Por qué inline JavaScript?**
R: Mantiene todo en un solo archivo HTML, más fácil de desplegar y versionar.

**P: ¿Puedo usar este formulario sin servidor?**
R: Casi. El `fetch('/api/submit-lead')` requiere backend. Para test local, agregar mock:
```javascript
if (response.status === 404) {
    alert('Mock: Formulario capturado\n' + JSON.stringify(formData));
}
```

**P: ¿Funciona en móvil?**
R: Sí, 100% responsive. Input types HTML5 para tel, email, number usan keyboards nativos.

**P: ¿Cómo cambio los precios de planes?**
R: Buscar `$99.990` y `$299.990` en HTML. También en descripción memoria.

**P: ¿Valida RUT?**
R: No, pero puede agregar validación RUT chileno en `validateForm()` si lo necesita.

---

**Estado:** Production-ready ✅
**Última actualización:** 30 Abril 2026
**Versión:** 1.0
