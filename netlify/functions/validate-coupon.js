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
    let body;

    // Try to extract body in multiple ways
    if (typeof req.body === 'string') {
      body = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      body = req.body.toString('utf-8');
    } else if (req.rawBody) {
      body = typeof req.rawBody === 'string' ? req.rawBody : req.rawBody.toString('utf-8');
    } else if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      // Maybe it's already parsed JSON
      body = JSON.stringify(req.body);
    } else {
      body = '{}';
    }

    const { coupon, plan } = JSON.parse(body || '{}');

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
