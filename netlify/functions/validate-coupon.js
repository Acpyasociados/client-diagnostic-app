/**
 * FunciÃ³n para validar cupones de descuento
 *
 * Uso: POST /api/validate-coupon
 * Body: { "coupon": "COUPON_CODE", "plan": "basico|premium" }
 *
 * Respuesta:
 * {
 *   "valid": true,
 *   "discount_percentage": 100,
 *   "final_price": 0,
 *   "message": "CupÃ³n vÃ¡lido - 100% descuento"
 * }
 */

export default async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'MÃ©todo no permitido' });
  }

  try {
    let parsedBody = {};

    // Try to extract and parse the body from multiple sources
    let bodyStr = null;

    if (req.body) {
      // Try direct string
      if (typeof req.body === 'string') {
        bodyStr = req.body;
      }
      // Try Buffer
      else if (Buffer.isBuffer(req.body)) {
        bodyStr = req.body.toString('utf-8');
      }
      // Try rawBody (Netlify specific)
      else if (req.rawBody) {
        if (typeof req.rawBody === 'string') {
          bodyStr = req.rawBody;
        } else if (Buffer.isBuffer(req.rawBody)) {
          bodyStr = req.rawBody.toString('utf-8');
        }
      }
      // If it's an object, check if it's already parsed
      else if (typeof req.body === 'object') {
        // If it has the fields we need, use it directly
        if (req.body.coupon !== undefined || req.body.plan !== undefined) {
          parsedBody = req.body;
        }
      }
    }

    // If we got a string, try to parse it
    if (bodyStr) {
      try {
        parsedBody = JSON.parse(bodyStr);
      } catch (parseError) {
        console.error('Failed to parse JSON body:', bodyStr, parseError);
        return json(400, { error: 'Invalid JSON in request body' });
      }
    }

    const { coupon, plan } = parsedBody;

    if (!coupon || !plan) {
      return json(400, { error: 'Falta cupÃ³n o plan' });
    }

    // Validar cupÃ³n
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
 * Valida un cupÃ³n contra la base de cupones disponibles
 */
function validateCoupon(coupon, plan) {
  // Cupones de producción — solo descuentos parciales.
  // NUNCA agregar cupones TEST/DEMO/100% aquí.
  // El descuento real se recalcula en create-diagnostic-order.js (server-side).
  const coupons = {
    'DESC50':    { valid: true, discount: 50, plans: ['basico', 'premium'] },
    'STARTUP30': { valid: true, discount: 30, plans: ['premium'] },

    // Agregar nuevos cupones aquí y en validateCouponServerSide() de create-diagnostic-order.js
  };

  const couponKey = coupon.toUpperCase().trim();
  const couponData = coupons[couponKey];

  if (!couponData) {
    return {
      valid: false,
      error: 'CupÃ³n invÃ¡lido o expirado'
    };
  }

  if (!couponData.plans.includes(plan)) {
    return {
      valid: false,
      error: `Este cupÃ³n no aplica al plan ${plan.toUpperCase()}`
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
    message: `CupÃ³n vÃ¡lido - ${couponData.discount}% descuento`,
    coupon_code: couponKey
  };
}

function json(statusCode, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}
