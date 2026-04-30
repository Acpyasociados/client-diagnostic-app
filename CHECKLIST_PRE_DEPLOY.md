# Checklist Pre-Deploy - Formulario Diagnóstico

## ✅ Verificaciones Finales Antes de Deploy

### 1. Archivos Entregados

- [ ] `formulario-diagnostico-completo.html` (37 KB) ← PRINCIPAL
- [ ] `README_FORMULARIO.md` (13 KB)
- [ ] `GUIA_RAPIDA_FORMULARIO.md` (11 KB)
- [ ] `FORMULARIO_COMPLETO_DOCUMENTACION.md` (10 KB)
- [ ] `TEST_CASES_FORMULARIO.md` (16 KB)
- [ ] `CAMBIOS_IMPLEMENTADOS.md` (16 KB)
- [ ] `DATOS_PRUEBA_FORMULARIO.md` (16 KB)
- [ ] `INDICE_MAESTRO_FORMULARIO.md` (navegación)
- [ ] `CHECKLIST_PRE_DEPLOY.md` (este archivo)

**Total:** 9 archivos, ~147 KB

---

### 2. Validación del HTML

- [ ] Abrir `formulario-diagnostico-completo.html` en navegador
- [ ] Verificar que carga sin errores (consola vacía)
- [ ] Verificar que se ve el header con logo
- [ ] Verificar que se ve pricing banner
- [ ] Verificar colores correctos (azul #1a2d3e, oro #d4a574)
- [ ] Verificar que todos los campos son visibles

**Si hay errores:**
- Revisar consola F12 → Console
- Verificar sintaxis HTML (buscar etiquetas sin cerrar)
- Verificar que CSS está inline (dentro de <style>)
- Verificar que JS está inline (dentro de <script>)

---

### 3. Prueba de Funcionalidad Básica

#### 3.1 Sector Dinámico
- [ ] Seleccionar "Servicios Profesionales"
- [ ] Aparecen 2 campos: "Tarifa horaria" + "Tamaño equipo"
- [ ] Cambiar a "Comercio / E-commerce"
- [ ] Aparecen 2 campos nuevos: "Valor inventario" + "Rotación"
- [ ] Campos anteriores desaparecen

#### 3.2 Sector "Otro"
- [ ] Seleccionar "Otro" en Rubro
- [ ] Aparece campo "Especifica tu rubro"
- [ ] Campo tiene input text vacío
- [ ] Cambiar a otro sector → campo desaparece

#### 3.3 Desafío "Otro"
- [ ] Seleccionar "Otro" en Desafío Principal
- [ ] Aparece campo "Especifica tu desafío"
- [ ] Campo tiene input text vacío
- [ ] Cambiar a otro desafío → campo desaparece

#### 3.4 Validación
- [ ] Click "Enviar" sin llenar nada
- [ ] Alert aparece: "Por favor completa todos los campos requeridos"
- [ ] Llenar solo nombre y email
- [ ] Intentar enviar → sigue pidiendo campos
- [ ] Llenar formulario completo → puede enviar

#### 3.5 Plan Selection
- [ ] Ver 2 cards: Básico y Premium
- [ ] Click Básico → se marca (borde dorado)
- [ ] Click Premium → Básico se desmarca, Premium se marca
- [ ] Ambos son radio buttons (solo uno a la vez)

---

### 4. Testing en Diferentes Sectores

Para cada sector, verificar que aparecen los campos correctos:

- [ ] Servicios Profesionales: Tarifa + Equipo
- [ ] Comercio/E-commerce: Inventario + Rotación
- [ ] Servicios Terreno: Combustible + Flota
- [ ] Construcción: Proyectos + Costo
- [ ] Gastronomía: Covers + Ticket
- [ ] Salud/Belleza: Citas + Servicios
- [ ] Tecnología: Equipo + MRR
- [ ] Educación: Estudiantes + Instructores
- [ ] Manufactura: Capacidad + % materia prima

---

### 5. Validación de Campos

- [ ] Email: Rechaza sin @, acepta con @
- [ ] Números: Rechaza texto, acepta números
- [ ] Teléfono: Acepta cualquier formato
- [ ] Campos requeridos: Marcan error si vacíos
- [ ] Campos condicionales: Solo validan si visibles

---

### 6. DevTools Network Testing

Con el formulario abierto:

- [ ] Abrir DevTools (F12)
- [ ] Tab: Network
- [ ] Llenar formulario completo (usar ejemplo del documento)
- [ ] Click "Enviar Diagnóstico"
- [ ] Ver request a `/api/submit-lead`
- [ ] Verificar método: POST
- [ ] Verificar Content-Type: `application/x-www-form-urlencoded`
- [ ] Verificar body contiene todos los campos
- [ ] Verificar `operational_fields` es JSON string

**Ejemplo Body esperado:**
```
name=Juan&email=juan@test.cl&sector=servicios_profesionales&...
operational_fields={"billable_rate":75000,"team_size":5}
```

---

### 7. Testing Responsive

#### Mobile (375px)
- [ ] Abrir DevTools → Toggle device (Ctrl+Shift+M)
- [ ] Seleccionar iPhone SE (375px)
- [ ] Formulario tiene 1 columna (no 2)
- [ ] Inputs full width
- [ ] Botones stackeados
- [ ] Scroll funciona
- [ ] Texto legible
- [ ] Seleccionador de planes es 1 card por línea

#### Tablet (768px)
- [ ] Formulario responsive
- [ ] 1-2 columnas según espacio
- [ ] Todo legible

#### Desktop (1920px)
- [ ] Formulario centrado (max-width 700px)
- [ ] 2 columnas donde aplique
- [ ] Botones lado a lado

---

### 8. Testing en Navegadores

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (si disponible)
- [ ] Edge (si disponible)

Para cada navegador:
- [ ] Carga sin errores
- [ ] Estilos correctos
- [ ] Funcionalidad completa
- [ ] Console sin errores

---

### 9. Validación Backend Integration

Si backend está corriendo localmente:

- [ ] Iniciar backend en localhost:3000
- [ ] Abrir formulario en localhost:3000
- [ ] Llenar con datos válidos
- [ ] Enviar
- [ ] Ver respuesta en DevTools Network
- [ ] Esperar mensaje de éxito
- [ ] Verificar que datos llegaron a backend
- [ ] Verificar en DB si es posible

**Si backend retorna error:**
- [ ] Leer error message
- [ ] Verificar que campos obligatorios están llenados
- [ ] Verificar estructura de datos
- [ ] Revisar validación en server.js

---

### 10. Prueba de Error Handling

- [ ] Desconectar internet
- [ ] Intentar enviar → debe mostrar error
- [ ] Conectar internet nuevamente
- [ ] Formulario debe permitir reintentar

- [ ] Bloquear request en DevTools (Network → right click → Block request)
- [ ] Intentar enviar → debe mostrar error
- [ ] Desbloquear y reintentar → debe funcionar

---

### 11. Prueba de Seguridad

- [ ] Abrir DevTools → Storage → LocalStorage
- [ ] Verificar que NO hay datos sensibles guardados
- [ ] Llenar con número de "tarjeta" ficticia (4111111111111111)
- [ ] Verificar que NO aparece en localStorage
- [ ] DevTools → Network → Ver body del POST
- [ ] Verificar que NO hay plaintext passwords

---

### 12. Documentación Validada

- [ ] README_FORMULARIO.md legible y completo
- [ ] GUIA_RAPIDA_FORMULARIO.md con instrucciones claras
- [ ] TEST_CASES_FORMULARIO.md con 30 casos
- [ ] DATOS_PRUEBA_FORMULARIO.md con 12 ejemplos
- [ ] FORMULARIO_COMPLETO_DOCUMENTACION.md técnica
- [ ] CAMBIOS_IMPLEMENTADOS.md comparativa
- [ ] INDICE_MAESTRO_FORMULARIO.md navegación

---

### 13. Código Validado

- [ ] HTML válido (sin etiquetas sin cerrar)
- [ ] CSS sin errors (sin colores inválidos)
- [ ] JavaScript sin errors (console vacía)
- [ ] No hay TODO comments
- [ ] Código está comentado donde es necesario
- [ ] Hardcoded configuration en lugar correcto
- [ ] Funciones bien nombradas

---

### 14. Performance Checks

- [ ] Página carga en < 1 segundo
- [ ] Validación es rápida (< 50ms)
- [ ] Cambio de sector es instantáneo (< 10ms)
- [ ] No hay lag en animaciones
- [ ] No hay memory leaks (DevTools → Memory)

---

### 15. Accesibilidad

- [ ] Tab navigation funciona (Tab, Shift+Tab)
- [ ] Tab order es sensible (arriba a abajo, left a right)
- [ ] Focus states visibles (borde dorado)
- [ ] Labels asociados con inputs
- [ ] Placeholders descriptivos
- [ ] Error messages claros

---

### 16. Preparación para Deploy

**Antes de git push:**
- [ ] Verificar que archivo HTML es correcto
- [ ] Verificar que documentación está completa
- [ ] Verificar que NO hay archivos temporales
- [ ] Verificar que NO hay credenciales en código

**Commit message:**
```
git add formulario-diagnostico-completo.html
git add *FORMULARIO*.md GUIA*.md DATOS*.md README*.md INDICE*.md
git commit -m "Agregar formulario dinámico con campos operacionales v1.0

- Implementar rubro/sector dinámico con opción 'Otro'
- Agregar campos operacionales según sector (9 rubros)
- Agregar selector tipo de asesor (3 opciones)
- Agregar desafío principal (8 + 'Otro')
- Validación completa en cliente
- Recolección JSON de campos dinámicos
- 7 documentos de soporte incluidos
- 30 casos de test incluidos
- Production-ready"
```

**Push:**
```bash
git push origin main
# Netlify auto-deploya automáticamente
```

---

### 17. Verificación Post-Deploy

Después de hacer push a Netlify:

- [ ] Esperar a que Netlify compile y depliegue (~2-3 min)
- [ ] Abrir URL de producción en navegador
- [ ] Verificar que formulario carga
- [ ] Verificar que estilos son correctos
- [ ] Verificar que funcionalidad completa funciona
- [ ] Llenar y enviar formulario
- [ ] Verificar en logs de Netlify
- [ ] Verificar en backend que datos llegan

---

### 18. Rollback Plan (Si es Necesario)

Si hay problema después de deploy:

```bash
# Revertir commit
git revert <commit-hash>
git push origin main

# O si es muy urgente:
git reset --hard HEAD~1
git push origin main -f
```

---

## 📋 Resumen de Checks

| Área | Checks | Status |
|------|--------|--------|
| Archivos | 9 documentos | [ ] |
| HTML | Validación + funcionalidad | [ ] |
| Dinámicos | Sector + desafío | [ ] |
| Validación | Cliente + formato | [ ] |
| Responsive | Mobile + tablet + desktop | [ ] |
| Navegadores | Chrome + Firefox + Safari | [ ] |
| Backend | Integración completa | [ ] |
| Seguridad | No localStorage, POST safe | [ ] |
| Documentación | 7 docs completos | [ ] |
| Performance | < 1s load, < 50ms validación | [ ] |
| Accesibilidad | Tab order + focus states | [ ] |
| Deploy | Listo para git push | [ ] |

---

## 🚀 Paso Final: Deploy

Cuando todo el checklist esté ✅:

```bash
cd /ruta/a/repo
cp formulario-diagnostico-completo.html public/index.html
cp *FORMULARIO*.md docs/  # O donde corresponda
cp GUIA*.md DATOS*.md INDICE*.md docs/

git add .
git commit -m "Deploy formulario dinámico v1.0"
git push origin main

# Netlify auto-deploya
# En ~3-5 minutos verás cambios en vivo
```

---

## ❌ Si Algo Falla

### El formulario no carga
1. Revisar consola F12
2. Ver error message
3. Revisar que archivo es .html válido
4. Reintentará recargar

### DevTools muestra errores
1. Abrir archivo HTML en editor
2. Buscar línea del error
3. Revisar sintaxis (paréntesis, comillas, etc.)
4. Corregir
5. Recargar navegador

### Backend no recibe datos
1. Verificar que `/api/submit-lead` existe
2. Verificar que backend está corriendo
3. Revisar CORS headers
4. Verificar estructura del POST body

### Algo más
1. Ver `GUIA_RAPIDA_FORMULARIO.md` → Troubleshooting
2. Ver `FORMULARIO_COMPLETO_DOCUMENTACION.md` → FAQ
3. Revisar `TEST_CASES_FORMULARIO.md` para el específico

---

**Última actualización:** 30 Abril 2026
**Estado:** Ready for Review
**Responsable:** Te corresponde a ti hacer este checklist
**Duración estimada:** 2-3 horas completo

✅ **Una vez completado todo, ¡listo para deploy!**
