# Guía: Integrar Cupones en el Formulario

## 🎯 OBJETIVO

Agregar un campo de cupón al formulario para que los clientes puedan aplicar descuentos 100% durante las pruebas.

---

## 📝 PASO 1: Editar `index.html`

Agregar este código **antes del botón de envío** (línea 74):

```html
          <div class="field">
            <label>Cupón de Descuento (opcional)</label>
            <input 
              type="text" 
              name="coupon" 
              id="couponInput"
              placeholder="Ej: TEST100, DEMO100, PRUEBA100" 
            />
            <small id="couponMessage" style="margin-top: 5px; display: block;"></small>
            <input type="hidden" name="discountPercentage" value="0" />
            <input type="hidden" name="finalPrice" value="0" />
          </div>
```

**Resultado:** Campo de cupón antes del botón "Continuar a pago"

---

## 💻 PASO 2: Agregar JavaScript de Validación

Reemplazar la sección `<script>` al final de `index.html` con esto:

```javascript
  <script>
    const plans = document.querySelectorAll('.plan');
    const planInput = document.querySelector('input[name="plan"]');
    const form = document.getElementById('leadForm');
    const button = document.getElementById('submitButton');
    const message = document.getElementById('message');
    const couponInput = document.getElementById('couponInput');
    const couponMessage = document.getElementById('couponMessage');
    const discountInput = document.querySelector('input[name="discountPercentage"]');
    const finalPriceInput = document.querySelector('input[name="finalPrice"]');

    // Precios base
    const basePrices = {
      'basico': 49900,
      'premium': 149900
    };

    // Plan selection
    plans.forEach((plan) => {
      plan.addEventListener('click', () => {
        plans.forEach(p => p.classList.remove('active'));
        plan.classList.add('active');
        planInput.value = plan.dataset.plan;
        // Resetear cupón cuando cambia plan
        resetCoupon();
      });
    });

    // Validar cupón cuando se pierde el foco
    couponInput.addEventListener('blur', () => {
      if (couponInput.value.trim()) {
        validateCoupon();
      }
    });

    // Validar cupón cuando presiona Enter
    couponInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        validateCoupon();
      }
    });

    // Función para validar cupón
    async function validateCoupon() {
      const coupon = couponInput.value.trim();
      const plan = planInput.value;

      if (!coupon) {
        resetCoupon();
        return;
      }

      try {
        const response = await fetch('/api/validate-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coupon, plan })
        });

        const data = await response.json();

        if (data.valid) {
          couponMessage.textContent = `✅ ${data.message}`;
          couponMessage.style.color = '#28a745';
          
          // Guardar descuento y precio final
          discountInput.value = data.discount_percentage;
          finalPriceInput.value = data.final_price;

          // Mostrar precio final
          if (data.final_price === 0) {
            couponMessage.textContent += ` - GRATIS`;
          } else {
            couponMessage.textContent += ` - Precio final: $${data.final_price.toLocaleString('es-CL')}`;
          }
        } else {
          couponMessage.textContent = `❌ ${data.error}`;
          couponMessage.style.color = '#dc3545';
          resetCoupon();
        }
      } catch (error) {
        couponMessage.textContent = '❌ Error validando cupón';
        couponMessage.style.color = '#dc3545';
        resetCoupon();
      }
    }

    // Función para resetear cupón
    function resetCoupon() {
      couponMessage.textContent = '';
      discountInput.value = '0';
      finalPriceInput.value = '0';
    }

    // Form submission
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      button.disabled = true;
      button.textContent = 'Procesando...';
      message.className = 'notice hidden';

      try {
        const payload = Object.fromEntries(new FormData(form).entries());
        const response = await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No fue posible iniciar el proceso');
        window.location.href = data.checkout_url;
      } catch (error) {
        message.textContent = error.message;
        message.className = 'notice error';
        button.disabled = false;
        button.textContent = 'Continuar a pago';
      }
    });
  </script>
```

---

## 🎨 PASO 3: Agregar CSS Opcional

Si quieres que se vea bonito, agregar en un `<style>`:

```css
input[name="coupon"] {
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: bold;
}

#couponMessage {
  font-weight: 600;
  margin-top: 8px;
}

#couponMessage.success {
  color: #28a745;
}

#couponMessage.error {
  color: #dc3545;
}
```

---

## 🧪 PASO 4: PROBAR LOCALMENTE

```bash
cd /sessions/loving-busy-darwin/client-diagnostic-app
netlify dev
```

Luego abre: `http://localhost:8888`

**Prueba estos cupones:**

1. **TEST100** (100% descuento, ambos planes)
   - Plan: Básico
   - Cupón: `TEST100`
   - Resultado: $0 (GRATIS)

2. **TESTPREMIUM** (100% descuento, solo premium)
   - Plan: Premium
   - Cupón: `TESTPREMIUM`
   - Resultado: $0 (GRATIS)

3. **DESC50** (50% descuento)
   - Plan: Básico
   - Cupón: `DESC50`
   - Resultado: $24.950

---

## 📊 CUPONES DISPONIBLES

| Cupón | Planes | Descuento | Precio Final |
|-------|--------|-----------|--------------|
| `TEST100` | Básico + Premium | 100% | Gratis |
| `DEMO100` | Básico + Premium | 100% | Gratis |
| `PRUEBA100` | Básico + Premium | 100% | Gratis |
| `TESTBASICO` | Básico | 100% | Gratis |
| `TESTPREMIUM` | Premium | 100% | Gratis |
| `DESC50` | Básico + Premium | 50% | Mitad precio |
| `STARTUP30` | Premium | 30% | $104.930 |

---

## ✅ CHECKLIST

- [ ] Agregué campo de cupón en HTML
- [ ] Agregué JavaScript de validación
- [ ] Agregué CSS (opcional)
- [ ] Probé con cupones localmente
- [ ] Los cupones funcionan y muestran el precio final
- [ ] Despliego en Netlify con `git push`

---

## 🔄 FLUJO COMPLETO

```
Cliente ingresa cupón
    ↓
Pierde el foco o presiona Enter
    ↓
JavaScript valida contra /api/validate-coupon
    ↓
Si es válido:
├─ Muestra ✅ "Cupón válido"
├─ Muestra precio final
└─ Guarda descuento en form data
    ↓
Si NO es válido:
├─ Muestra ❌ "Cupón inválido"
└─ Resetea descuento
    ↓
Cliente envía formulario
    ↓
submit-lead.js recibe datos con descuento
    ↓
Cálcula precio final = Precio base - Descuento
    ↓
Crea checkout en Mercado Pago con precio final
```

---

## 🛠️ AGREGAR NUEVOS CUPONES

Para agregar más cupones, editar:

`netlify/functions/validate-coupon.js`

```javascript
const coupons = {
  'TEST100': { valid: true, discount: 100, plans: ['basico', 'premium'] },
  'MIEMPRESA': { valid: true, discount: 100, plans: ['basico'] },  // ← Nuevo
  'AMIGO50': { valid: true, discount: 50, plans: ['premium'] },   // ← Nuevo
};
```

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Funciona con Mercado Pago?**  
R: Sí. El cupón se aplica antes de crear el checkout, así que MP ve el precio final.

**P: ¿Se puede usar múltiples cupones?**  
R: No, el formulario acepta uno. Puedes cambiar por otro si no es válido.

**P: ¿Dónde se guardan los cupones?**  
R: En el código (desarrollo). En producción, usar base de datos.

**P: ¿Puedo ver cupones usados?**  
R: Sí, en audit-leads verás cuál se usó (próxima mejora).

---

## ✨ CONCLUSIÓN

Con estos pasos, tu formulario tendrá un campo bonito para cupones que:
- ✅ Valida en tiempo real
- ✅ Muestra precio final
- ✅ Aplica descuento al checkout
- ✅ Es fácil para el cliente

¡Listo para pruebas sin costo! 🎉

