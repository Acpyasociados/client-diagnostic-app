/**
 * Función para validar cupones de descuento
 *
 * Uso: POST /api/validate-coupon
 * Body: { "coupon": "COUPON_CODE", "plan": "basico|premium" }
 *
 * Respuesta:
 * {
 *   "valid": true,
 *   "discount_percentage": 100,
 *   "final_price": 0,
 *   "message": "Cupón válido - 100% descuento"
 * }
 */

export default async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Método no permitido' });
  }

  try {
    let parsedBody;

    // Handle different body formats
    if (req.body) {
      let bodyContent = req.body;

      // Convert Buffer to string
      if (Buffer.isBuffer(bodyContent)) {
        bodyContent = bodyContent.toString('utf-8');
      }
      // If it's already a string, use it
      else if (typeof bodyContent === 'string') {
        // Already a string
      }
      // If it's an object that looks like already-parsed JSON (has coupon/plan properties)
      else if (typeof bodyContent === 'object' && (bodyContent.coupon || bodyContent.plan)) {
        parsedBody = bodyContent;
      }
      // Last resort: if it's an object, try toString()
      else if (typeof bodyContent === 'object') {
        const str = String(bodyContent);
        // If toString() returns something useful (not "[object Object]"), use it
        if (str !== '[object Object]' && !str.includes('[object ')) {
          bodyContent = str;
        }
      }

      // If we haven't parsed yet, parse the string
      if (!parsedBody && typeof bodyContent === 'string') {
        try {
          parsedBody = JSON.parse(bodyContent);
        } catch (e) {
          // If JSON parse fails, try alternative method
          // Maybe the body is URL encoded or something else
          console.error('Failed to parse JSON:', bodyContent, e);
          return json(400, { error: 'Invalid request body format' });
        }
      }
    }

    // Default to empty object if no body
    if (!parsedBody) {
      parsedBody = {};
    }

    const { coupon, plan } = parsedBody;

    if (!coupon || !plan) {
      return json(400, { error: 'Falta cupón o plan' });
    }

    // Validar cupón
    const result = validateCoupon(coupon, plan);

    if (!result.valid) {
      return json(400, result);
    }

    return json(200, result);
  } catch (error) {
    console.error('Coupon validation error:', error);
    return json(500, { error: error.message });
  }
};

/**
 * Valida un cupón contra la base de cupones disponibles
 */
function validateCoupon(coupon, plan) {
  // Base de cupones disponibles (desarrollo)
  // En producción, guardar en base de datos
  const coupons = {
    // Cupones de prueba 100% descuento
    'TEST100': { valid: true, discount: 100, plans: ['basico', 'premium'] },
    'DEMO100': { valid: true, discount: 100, plans: ['basico', 'premium'] },
    'PRUEBA100': { valid: true, discount: 100, plans: ['basico', 'premium'] },
    'TESTBASICO': { valid: true, discount: 100, plans: ['basico'] },
    'TESTPREMIUM': { valid: true, discount: 100, plans: ['premium'] },

    // Cupones de descuento parcial (ejemplo)
    'DESC50': { valid: true, discount: 50, plans: ['basico', 'premium'] },
    'STARTUP30': { valid: true, discount: 30, plans: ['premium'] },

    // Agregue más cupones aquí según necesite
  };

  const couponKey = coupon.toUpperCase().trim();
  const couponData = coupons[couponKey];

  if (!couponData) {
    return {
      valid: false,
      error: 'Cupón inválido o expirado'
    };
  }

  if (!couponData.plans.includes(plan)) {
    return {
      valid: false,
      error: `Este cupón no aplica al plan ${plan.toUpperCase()}`
    };
  }

  // Calcular precio final
  const basePrices = {
    'basico': 49900,
    'premium': 149900
  };

  const basePrice = basePrices[plan];
  const discount = (basePrice * couponData.discount) / 100;
  const finalPrice = Math.max(0, basePrice - discount);

  return {
    valid: true,
    discount_percentage: couponData.discount,
    base_price: basePrice,
    discount_amount: discount,
    final_price: finalPrice,
    message: `Cupón válido - ${couponData.discount}% descuento`,
    coupon_code: couponKey
  };
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
