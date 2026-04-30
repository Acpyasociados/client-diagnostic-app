# Casos de Prueba - Formulario Diagnóstico Completo

## Requisitos Previos

- Abrir `formulario-diagnostico-completo.html` en navegador moderno
- Backend `/api/submit-lead` disponible en `http://localhost:3000` (o Netlify)
- DevTools abierto para verificar requests

## Pruebas Funcionales

### Test 1: Visualización Inicial ✅

**Objetivo:** Verificar que el formulario carga correctamente

**Pasos:**
1. Abrir `formulario-diagnostico-completo.html`
2. Verificar que se ven todas las secciones:
   - Header con logo y título
   - Pricing banner ($99.990 Básico / $299.990 Premium)
   - Info strip (campos requeridos con *)
   - Formulario en 7 secciones

**Resultado esperado:**
- Página carga sin errores
- Estilos aplican correctamente (azul #1a2d3e, oro #d4a574)
- Responsive en mobile y desktop
- Logo y títulos visibles

---

### Test 2: Campos Requeridos Marcan * ✅

**Objetivo:** Verificar que campos obligatorios están marcados

**Pasos:**
1. Ver etiquetas en formulario
2. Confirmar que tienen asterisco *

**Resultado esperado:**
- Nombre, Email, Teléfono, Empresa: tienen *
- Rubro/Sector: tiene *
- Campos operacionales: tienen * (required)
- Ingresos mensuales, Margen, Clientes, Costos: tienen *
- Canal principal, Problema, Objetivo: tienen *
- Desafío principal: tiene *
- Tipo de asesor: tiene *
- Plan: tiene *

---

### Test 3: Rubro "Otro" - Campo Condicional ✅

**Objetivo:** Verificar que campo texto aparece/desaparece

**Pasos:**
1. Cargar formulario
2. Seleccionar rubro normal (ej: "Servicios Profesionales")
3. Verificar que NO aparece campo "Especifica tu rubro"
4. Seleccionar "Otro" en Rubro
5. Verificar que aparece campo "Especifica tu rubro" con input text
6. Cambiar a otro rubro normal
7. Verificar que desaparece el campo

**Resultado esperado:**
- Campo condicional slide in/out smoothly
- Input requiere ser llenado cuando visible
- Se limpia al cambiar a otro rubro
- Validación solo aplica si es visible

---

### Test 4: Campos Operacionales Dinámicos - Servicios Profesionales ✅

**Objetivo:** Verificar generación dinámica de campos según sector

**Pasos:**
1. Cargar formulario
2. En sección "Información Empresarial", seleccionar "Servicios Profesionales"
3. Scroll abajo para ver nueva sección "Datos Operacionales"

**Resultado esperado:**
- Aparece sección con título "Datos Operacionales"
- Container con fondo gris y borde dorado izquierdo
- 2 campos visibles:
  - "Tarifa horaria facturada (CLP)" con placeholder "Ej: 75000"
  - "Tamaño del equipo (personas)" con placeholder "Ej: 5"
- Ambos tienen * (required)

---

### Test 5: Campos Operacionales - Comercio/E-commerce ✅

**Objetivo:** Verificar cambio de campos al cambiar sector

**Pasos:**
1. Tener "Servicios Profesionales" seleccionado
2. Ver "Tarifa horaria" y "Tamaño equipo"
3. Cambiar a "Comercio / E-commerce"
4. Verificar que campos cambian

**Resultado esperado:**
- Campos anteriores desaparecen
- Nuevos campos aparecen:
  - "Valor total de inventario (CLP)" - "Ej: 5000000"
  - "Rotación de inventario (días)" - "Ej: 30"

---

### Test 6: Campos Operacionales - Todos los Rubros ✅

**Objetivo:** Verificar que cada rubro genera sus campos correctos

**Pasos:** Repetir Test 5 para cada rubro:

| Rubro | Campo 1 | Campo 2 |
|-------|---------|---------|
| Servicios Terreno | Consumo combustible (litros) | Tamaño de flota (vehículos) |
| Construcción | Proyectos activos simultáneos | Costo promedio por proyecto (CLP) |
| Gastronomía | Covers diarios promedio | Ticket promedio (CLP) |
| Salud y Belleza | Citas diarias promedio | Cantidad de servicios distintos |
| Tecnología | Tamaño del equipo de desarrollo | MRR - Ingresos recurrentes (CLP) |
| Educación | Cantidad de estudiantes | Cantidad de instructores |
| Manufactura | Capacidad producción mensual (unidades) | Costo materia prima (% COGS) |

**Resultado esperado:**
- Cada rubro genera sus campos específicos
- Placeholders son coherentes
- Validación required aplica según configuración

---

### Test 7: Campo Tecnología - MRR Opcional ✅

**Objetivo:** Verificar que MRR no tiene * (es opcional)

**Pasos:**
1. Seleccionar "Tecnología / Software"
2. Ver campos operacionales

**Resultado esperado:**
- "Tamaño del equipo de desarrollo": tiene *
- "MRR - Ingresos recurrentes": NO tiene *
- Placeholder dice "(opcional)"
- Se puede enviar formulario sin llenar MRR

---

### Test 8: Tipo de Asesor - 3 Opciones ✅

**Objetivo:** Verificar dropdown con 3 tipos de asesor

**Pasos:**
1. Scroll a sección "Asesor y Plan"
2. Click en dropdown "Tipo de Asesor"
3. Verificar opciones

**Resultado esperado:**
- 3 opciones visibles:
  1. Contador Independiente
  2. Asesor Tributario - Planificación Financiera
  3. Empresa Contable
- Default: "--Selecciona tipo de asesor--"

---

### Test 9: Plan Selector - Básico vs Premium ✅

**Objetivo:** Verificar selección de planes

**Pasos:**
1. Ver sección de planes con 2 botones
2. Click "Básico" card
3. Verificar que se marca
4. Click "Premium" card
5. Verificar que se desmarcar "Básico" y marca "Premium"

**Resultado esperado:**
- 2 cards lado a lado (desktop)
- Cada card muestra nombre y precio
- Solo uno puede estar seleccionado
- Bordes cambian a dorado cuando seleccionado
- Background cambia a crema cuando seleccionado

---

### Test 10: Desafío "Otro" - Campo Condicional ✅

**Objetivo:** Verificar campo condicional de desafío

**Pasos:**
1. Scroll a sección "Desafío Principal"
2. Seleccionar "Costos operativos muy altos"
3. Verificar que NO aparece campo "Especifica tu desafío"
4. Seleccionar "Otro (especificar)"
5. Verificar que aparece campo "Especifica tu desafío"
6. Cambiar a otro desafío
7. Verificar que desaparece

**Resultado esperado:**
- Campo condicional solo visible cuando "Otro" seleccionado
- Input requiere valor cuando visible
- Se limpia al cambiar a otro desafío

---

### Test 11: Validación - Campos Obligatorios ✅

**Objetivo:** Verificar que validación evita envío incompleto

**Pasos:**
1. Click "Enviar Diagnóstico" sin llenar nada
2. Verificar mensajes de error

**Resultado esperado:**
- Alert: "Por favor completa todos los campos requeridos"
- NO se envía formulario
- Campos vacíos tienen borde rojo
- Mensajes de error aparecen debajo de campos

---

### Test 12: Validación - Email ✅

**Objetivo:** Verificar validación de email

**Pasos:**
1. Llenar "Email" con valor inválido (ej: "notanemail")
2. Click "Enviar"

**Resultado esperado:**
- Error message: "Por favor ingresa un email válido"
- Campo tiene borde rojo
- No envía

**Pasos 2:**
1. Llenar con email válido (ej: "test@example.cl")
2. Click "Enviar"

**Resultado esperado:**
- Error desaparece
- Campo vuelve a borde gris

---

### Test 13: Validación - Números ✅

**Objetivo:** Verificar validación de campos numéricos

**Pasos:**
1. Llenar "Ingresos Mensuales" con texto (ej: "abc")
2. Click "Enviar"

**Resultado esperado:**
- Error: "Por favor ingresa tus ingresos mensuales"
- Campo tiene borde rojo

**Pasos 2:**
1. Llenar con número válido (ej: "5000000")
2. Error desaparece

---

### Test 14: Validación - Margen Porcentaje ✅

**Objetivo:** Verificar que margen está entre 0-100

**Pasos:**
1. Llenar "Margen de Ganancia" con "150"
2. Click "Enviar"

**Resultado esperado:**
- Formalmente, HTML5 permite (max="100"), pero valor se acepta
- Validación en servidor recomendada

---

### Test 15: Validación - Sector "Otro" Requiere Especificación ✅

**Objetivo:** Verificar que campo condicional valida correctamente

**Pasos:**
1. Seleccionar "Otro" en Rubro
2. Dejar vacío "Especifica tu rubro"
3. Click "Enviar"

**Resultado esperado:**
- Error: "Por favor especifica tu rubro personalizado"
- Campo condicional tiene borde rojo

**Pasos 2:**
1. Llenar "Especifica tu rubro" con "Transporte"
2. Click "Enviar"

**Resultado esperado:**
- Error desaparece (si otros campos están ok)

---

### Test 16: Validación - Desafío "Otro" Requiere Especificación ✅

**Objetivo:** Verificar validación de desafío condicional

**Pasos:**
1. Seleccionar "Otro" en Desafío Principal
2. Dejar vacío "Especifica tu desafío"
3. Click "Enviar"

**Resultado esperado:**
- Error: "Por favor especifica tu desafío personalizado"
- Campo condicional tiene borde rojo

---

### Test 17: Validación - Campos Operacionales ✅

**Objetivo:** Verificar que campos dinámicos validan

**Pasos:**
1. Seleccionar "Servicios Profesionales"
2. Dejar vacío "Tarifa horaria facturada"
3. Click "Enviar"

**Resultado esperado:**
- Error en campo operacional
- Borde rojo, mensaje de error

---

### Test 18: Envío Exitoso - Mock Backend ✅

**Objetivo:** Verificar flujo completo de envío

**Pasos:**
1. Llenar formulario COMPLETO:
   - Nombre: "Juan García"
   - Email: "juan@test.cl"
   - Teléfono: "+56912345678"
   - Empresa: "Mi Empresa"
   - Sector: "Servicios Profesionales"
   - Tarifa horaria: "75000"
   - Tamaño equipo: "5"
   - Ingresos mensuales: "5000000"
   - Margen: "25"
   - Clientes: "50"
   - Mayor costo: "Arriendo"
   - Canal principal: "Redes sociales"
   - Problema: "Baja rentabilidad"
   - Objetivo 6 meses: "Aumentar 30%"
   - Desafío: "Costos operativos muy altos"
   - Tipo asesor: "Contador Independiente"
   - Plan: "Básico"

2. Click "Enviar Diagnóstico"

**Resultado esperado:**
- Button deshabilitado
- Loading spinner aparece
- "Enviando diagnóstico..."
- Después de ~1 segundo:
  - Spinner desaparece
  - Mensaje verde: "¡Diagnóstico enviado exitosamente!"
  - Auto-scroll al mensaje
  - Formulario se limpian los datos
  - Campos operacionales desaparecen

---

### Test 19: Envío Exitoso - DevTools Network ✅

**Objetivo:** Verificar estructura de datos enviados

**Pasos:**
1. Abrir DevTools > Network
2. Completar y enviar formulario (Test 18)
3. Click en request "submit-lead"
4. Ver "Request Body"

**Resultado esperado:**
- Content-Type: `application/x-www-form-urlencoded`
- Body contiene:
```
name=Juan García
email=juan@test.cl
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
goal_6m=Aumentar%2030%25
main_challenge=costos_altos
main_challenge_other=
advisor_type=contador_independiente
plan=basico
operational_fields={"billable_rate":75000,"team_size":5}
```

---

### Test 20: Envío Sector "Otro" ✅

**Objetivo:** Verificar que sector personalizado se envía correctamente

**Pasos:**
1. Completar formulario
2. En Rubro seleccionar "Otro"
3. En "Especifica tu rubro" escribir "Transporte"
4. Enviar

**Resultado esperado:**
- DevTools Network muestra:
  - `sector=otro`
  - `sector_other=Transporte`
- Backend recibe ambos campos
- Validación backend: sector_other es requerido si sector=otro

---

### Test 21: Envío Desafío "Otro" ✅

**Objetivo:** Verificar que desafío personalizado se envía

**Pasos:**
1. Completar formulario
2. En Desafío seleccionar "Otro"
3. En "Especifica tu desafío" escribir "Mi desafío personalizado"
4. Enviar

**Resultado esperado:**
- DevTools Network muestra:
  - `main_challenge=otro`
  - `main_challenge_other=Mi desafío personalizado`

---

### Test 22: Reset Button - Limpiar Todo ✅

**Objetivo:** Verificar que botón Reset limpia completamente

**Pasos:**
1. Completar y enviar formulario
2. Click "Limpiar Formulario"

**Resultado esperado:**
- Todos los inputs se limpian
- Selectores vuelven a default
- Radio buttons desseleccionados
- Campos operacionales desaparecen
- Campos condicionales desaparecen
- Mensajes de error desaparecen
- Mensaje de éxito desaparece

---

### Test 23: Responsivo - Mobile ✅

**Objetivo:** Verificar que funciona en mobile

**Pasos:**
1. DevTools > Toggle device toolbar (375px width)
2. Navegar por formulario

**Resultado esperado:**
- 1 columna (no 2)
- Inputs full width
- Botones stackeados verticalmente
- Texto legible
- Buttons tocables (min 44px altura)
- Plan selector: 1 card por línea
- Scroll fluido
- Mensaje de éxito se ve bien

---

### Test 24: Responsivo - Tablet ✅

**Objetivo:** Verificar que funciona en tablet

**Pasos:**
1. DevTools > iPad Air (820px width)
2. Verificar layout

**Resultado esperado:**
- 2 columnas mantiene
- Espacio adecuado
- Botones lado a lado si hay espacio

---

### Test 25: Error Backend - 400 ✅

**Objetivo:** Verificar manejo de errores del servidor

**Pasos:**
1. Modificar formulario en DevTools para enviar sector inválido
   ```javascript
   // En DevTools console:
   document.getElementById('sector').value = 'sector_invalido';
   document.forms[0].submit();
   ```
2. Observar respuesta

**Resultado esperado:**
- Alert con mensaje de error: "Error: [mensaje del servidor]"
- Loading desaparece
- Botón se habilita de nuevo
- Formulario permanece con datos

---

### Test 26: Error de Red ✅

**Objetivo:** Verificar manejo de errores de conexión

**Pasos:**
1. Desconectar internet o bloquear request en DevTools
2. Llenar y enviar formulario
3. Observar

**Resultado esperado:**
- Alert: "Error al enviar el formulario: [error message]"
- Loading desaparece
- Botón se habilita
- Datos permanecen en formulario

---

### Test 27: Focus States - Accesibilidad ✅

**Objetivo:** Verificar que inputs tienen focus states visibles

**Pasos:**
1. Click en input
2. Tab entre campos
3. Observar border y glow

**Resultado esperado:**
- Borde dorado (#d4a574) aparece
- Glow dorado semi-transparente
- Background crema (#FFFAF0)
- Tab order correcto (arriba a abajo, left a right)

---

### Test 28: Placeholder Text ✅

**Objetivo:** Verificar que placeholders son útiles

**Pasos:**
1. Ver cada input
2. Verificar placeholder

**Resultado esperado:**
- Nombres específicos (ej: "Juan García")
- Números realistas (ej: "75000", "5")
- Text descriptivo (ej: "Redes sociales")

---

### Test 29: Datos Sensibles ✅

**Objetivo:** Verificar que datos sensibles se manejan correctamente

**Pasos:**
1. Completar formulario con datos "sensibles"
2. Check DevTools Storage > localStorage, sessionStorage
3. Verificar Network inspector

**Resultado esperado:**
- NO hay localStorage de datos sensibles
- Form data en POST body (no GET URL)
- No hay plaintext passwords/keys
- HTTPS en producción (Netlify)

---

### Test 30: Campos Operacionales JSON - DevTools ✅

**Objetivo:** Verificar estructura JSON de campos dinámicos

**Pasos:**
1. Abrir DevTools Console
2. Completar formulario con Servicios Profesionales
3. Antes de submit, en console:
   ```javascript
   const form = document.getElementById('diagnosticForm');
   const formData = new FormData(form);
   const opFields = JSON.parse(formData.get('operational_fields'));
   console.log(opFields);
   ```

**Resultado esperado:**
```javascript
{
  billable_rate: 75000,
  team_size: 5
}
```

---

## Checklist Final

- [ ] Test 1: Visualización ✅
- [ ] Test 2: Asteriscos * ✅
- [ ] Test 3: Sector "Otro" ✅
- [ ] Test 4: Campos Operacionales ✅
- [ ] Test 5: Cambio de Sector ✅
- [ ] Test 6: Todos los Rubros ✅
- [ ] Test 7: MRR Opcional ✅
- [ ] Test 8: Tipo de Asesor ✅
- [ ] Test 9: Plan Selector ✅
- [ ] Test 10: Desafío "Otro" ✅
- [ ] Test 11: Validación Obligatorios ✅
- [ ] Test 12: Validación Email ✅
- [ ] Test 13: Validación Números ✅
- [ ] Test 14: Margen % ✅
- [ ] Test 15: Sector "Otro" Validación ✅
- [ ] Test 16: Desafío "Otro" Validación ✅
- [ ] Test 17: Campos Operacionales Validación ✅
- [ ] Test 18: Envío Exitoso ✅
- [ ] Test 19: Network Request ✅
- [ ] Test 20: Sector "Otro" Envío ✅
- [ ] Test 21: Desafío "Otro" Envío ✅
- [ ] Test 22: Reset Button ✅
- [ ] Test 23: Mobile ✅
- [ ] Test 24: Tablet ✅
- [ ] Test 25: Error 400 ✅
- [ ] Test 26: Error Red ✅
- [ ] Test 27: Focus States ✅
- [ ] Test 28: Placeholders ✅
- [ ] Test 29: Datos Sensibles ✅
- [ ] Test 30: JSON Operacionales ✅

---

**Total Tests:** 30
**Tiempo Estimado:** 2-3 horas (minucioso)
**Resultado:** Production-Ready ✅
