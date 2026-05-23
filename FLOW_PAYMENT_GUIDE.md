# 🔄 FLOW Payment Gateway - Complete Guide

## What's Executing in the Background: Complete Payment Flow

When you click the **"Continuar al Pago"** button, here's exactly what happens (step by step):

---

## STAGE 1: Form Submission (Client Browser)

```
User clicks "Continuar al Pago" button
         ↓
JavaScript validates form (checkValidity())
         ↓
Form data collected (name, email, phone, plan, etc.)
         ↓
Sends POST request to: /.netlify/functions/flow-create-payment
         ↓
Headers: Content-Type: application/json
Body: JSON with all form data
```

**Form data being sent:**
```json
{
  "name": "Juan test",
  "email": "test@example.com",
  "phone": "+56901234567",
  "company": "Test Company",
  "sector": "gastronomia",
  "plan": "basico",
  "amount": 1000,
  "monthly_sales": "15000000",
  "profit_margin": "20",
  ...additional fields...
}
```

---

## STAGE 2: Create Payment Function (Netlify Backend)

**File:** `netlify/functions/flow-create-payment.js`

### What happens:

1. **Function receives form data**
   ```javascript
   const formData = await parseBody(event); // Parse JSON body
   ```

2. **Validation**
   ```javascript
   const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'plan'];
   // Check all fields present
   ```

3. **Determine amount based on plan**
   ```javascript
   const priceBasic = parseInt(process.env.PRICE_BASIC_CLP) || 1000;    // 1000 CLP
   const pricePremium = parseInt(process.env.PRICE_PREMIUM_CLP) || 11000; // 11000 CLP
   const amount = formData.plan === 'premium' ? pricePremium : priceBasic;
   ```

4. **Create unique order ID**
   ```javascript
   const orderId = `ACP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
   // Example: ACP-1779562155517-fde29459
   ```

5. **Store case data in Netlify Blobs** (persistent storage)
   ```javascript
   const caseData = {
     id: orderId,
     name, email, phone, company, sector,
     plan, amount,
     status: 'pending',
     created_at: new Date().toISOString()
   };
   await store.setJSON(orderId, caseData);
   ```

6. **Prepare Flow API parameters**
   ```javascript
   const flowParams = {
     apiKey: FLOW_API_KEY,                          // Your Flow merchant ID
     commerceOrder: orderId,                        // Order ID
     subject: `Diagnóstico ACP - ${company}`,       // Payment description
     amount: amount,                                // Amount in CLP (1000 or 11000)
     email: email,                                  // Client email
     currency: 'CLP',                               // Chilean Peso
     urlReturn: `${SITE_URL}/flow-success.html?...`, // Where to send client after payment
     urlConfirm: `${SITE_URL}/.netlify/functions/flow-webhook` // Webhook endpoint
   };
   ```

7. **Calculate SHA256 signature** (CRITICAL for security)
   ```javascript
   function generateFlowSignature(params, secret) {
     // Step 1: Sort parameter keys alphabetically
     const sortedKeys = Object.keys(params).sort();
     // ['amount', 'apiKey', 'commerceOrder', 'currency', 'email', 'subject', 'urlConfirm', 'urlReturn']
     
     // Step 2: Concatenate key + value for each parameter
     const sortedString = sortedKeys
       .map(key => `${key}${params[key]}`)
       .join('');
     // "amount1000apiKey1F7ABDF2-7286-4261-9A54-963935CDCL2I..."
     
     // Step 3: Append secret key
     const withSecret = sortedString + FLOW_SECRET_KEY;
     // "amount1000apiKey1F7...9ebebcc7a7929aac1472c21b75fb764522b6601d"
     
     // Step 4: SHA256 hash
     return crypto.createHash('sha256')
       .update(withSecret)
       .digest('hex');
     // "75194e5ae0a7ad535dd216ffe6a55825fec557f8c121578ce957f2740b8b0404"
   }
   
   flowParams.s = generateFlowSignature(flowParams, FLOW_SECRET_KEY);
   ```

### Why Signature Calculation?

- **Security:** Proves your request comes from you (authenticated merchant)
- **Tamper-proof:** If any parameter changes, signature becomes invalid
- **Flow verification:** Flow recalculates signature using THEIR copy of your secret key
  - If signatures match → Request is legitimate
  - If signatures don't match → Request rejected with "Invalid Signature" (code 108)

**⚠️ CRITICAL:** The secret key MUST match between:
- Your environment variable (`FLOW_SECRET_KEY` in Netlify)
- Flow's registered account

This was THE problem! We had wrong credentials:
- ❌ Old: `419fd1dc315b285498f60189ae50507c1df2dd6a`
- ✅ Correct: `9ebebcc7a7929aac1472c21b75fb764522b6601d`

8. **Send request to Flow API**
   ```javascript
   const flowResponse = await fetch('https://sandbox.flow.cl/api/payment/create', {
     method: 'POST',
     headers: { 
       'Content-Type': 'application/x-www-form-urlencoded',
       'Accept': 'application/json'
     },
     body: new URLSearchParams(flowParams).toString()
     // Sends as: apiKey=...&commerceOrder=...&s=...&amount=...etc
   });
   ```

9. **Receive response from Flow**
   ```javascript
   const flowData = await flowResponse.json();
   // Response should be:
   // {
   //   "status": "SUCCESS",
   //   "token": "xxxxxxxxxxxxx",
   //   "url": "https://www.flow.cl/app/pay.php?token=xxxxx"
   // }
   ```

10. **Store payment token in Blobs**
    ```javascript
    caseData.flow_token = flowData.token;
    caseData.payment_created = new Date().toISOString();
    await store.setJSON(orderId, caseData);
    ```

11. **Return payment URL to client**
    ```javascript
    return {
      success: true,
      orderId: orderId,
      paymentUrl: flowData.url,  // URL to Flow payment page
      token: flowData.token
    };
    ```

---

## STAGE 3: Payment Processing (Flow External Service)

```
Client browser receives paymentUrl
         ↓
Client redirected to Flow checkout page
         ↓
https://www.flow.cl/app/pay.php?token=xxxxx
         ↓
Client enters card details (Visa, Mastercard, etc.)
         ↓
Client completes payment
         ↓
Flow processes payment with banks
```

**At this point:**
- Client is on Flow's secure payment page (NOT your website)
- You cannot see card numbers (they never come to your servers)
- Flow handles PCI compliance
- Payment is processed by Chilean banking system

---

## STAGE 4: Payment Confirmation (Webhook Callback)

After payment succeeds or fails, **Flow makes a request back to your webhook endpoint:**

```
Flow payment system determines result
         ↓
Makes GET request to: /.netlify/functions/flow-webhook
With parameters: ?token=...&flowOrder=...&commerceOrder=...&requestSignature=...
         ↓
Your function verifies signature (same algorithm)
         ↓
If signature valid: Update case status to "pagado"
If signature invalid: Reject (prevents spoofing)
         ↓
Flow redirects client to: /flow-success.html?orderId=...
```

**File:** `netlify/functions/flow-webhook.js`

### What happens in webhook:

1. **Extract webhook parameters**
   ```javascript
   const params = {
     token: query.token,
     flowOrder: query.flowOrder,
     commerceOrder: query.commerceOrder,
     requestSignature: query.requestSignature
   };
   ```

2. **Verify signature** (prevents fraudulent webhooks)
   ```javascript
   function verifyFlowSignature(params, signature, secret) {
     const paramsWithoutSignature = { ...params };
     delete paramsWithoutSignature.requestSignature;
     
     // Recalculate signature
     const sortedString = Object.keys(paramsWithoutSignature)
       .sort()
       .map(key => `${key}${paramsWithoutSignature[key]}`)
       .join('');
     
     const computedSignature = crypto
       .createHash('sha256')
       .update(sortedString + secret)
       .digest('hex');
     
     // Compare with provided signature
     return computedSignature === signature;
   }
   
   if (!verifyFlowSignature(params, requestSignature, FLOW_SECRET_KEY)) {
     return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
   }
   ```

3. **Update case status**
   ```javascript
   caseData.status = 'pagado';
   caseData.paid_at = new Date().toISOString();
   caseData.flow_reference = params.flowOrder;
   caseData.flow_token = params.token;
   await store.setJSON(orderId, caseData);
   ```

4. **Trigger post-payment actions** (From the plan)
   ```javascript
   // Trigger 3 concurrent operations:
   
   // A. Send questionnaire email (task #3)
   await fetch('/.netlify/functions/send-questionnaire-email', {
     method: 'POST',
     body: JSON.stringify({ orderId, caseData })
   });
   
   // B. Generate diagnostic report (task #4)
   await fetch('/.netlify/functions/generate-report', {
     method: 'POST',
     body: JSON.stringify({ orderId, caseData })
   });
   
   // C. Notify advisor of payment (task #5)
   await fetch('/.netlify/functions/send-advisor-payment-notification', {
     method: 'POST',
     body: JSON.stringify({ orderId, caseData, flowToken })
   });
   ```

---

## 📊 Complete Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. User fills diagnostic form (5 sections)                │  │
│  │    - Company info                                         │  │
│  │    - Business profile                                     │  │
│  │    - Operations details                                   │  │
│  │    - Current challenges                                   │  │
│  │    - Plan selection (basic 1000 or premium 11000 CLP)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. Clicks "Continuar al Pago" button                      │  │
│  │    - Form validates (all required fields)                 │  │
│  │    - Phone regex validates Chilean format                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. POST to /.netlify/functions/flow-create-payment        │  │
│  │    Headers: Content-Type: application/json                │  │
│  │    Body: { name, email, phone, plan, sector, ... }        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ (Internet)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              NETLIFY BACKEND (Your Servers)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. flow-create-payment.js                                 │  │
│  │    - Validate all required fields                          │  │
│  │    - Generate unique orderId: ACP-timestamp-random         │  │
│  │    - Determine amount: 1000 or 11000 CLP                  │  │
│  │    - Create caseData object                                │  │
│  │    - Store in Netlify Blobs (persistent storage)          │  │
│  │    - Create Flow API parameters                            │  │
│  │    - Calculate SHA256 signature (authentication)           │  │
│  │    - POST to Flow API                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Netlify Blobs Storage                                     │  │
│  │ (Persistent case data)                                    │  │
│  │                                                            │  │
│  │ Key: ACP-1779562155517-fde29459                            │  │
│  │ Value: {                                                  │  │
│  │   id, name, email, phone,                                 │  │
│  │   company, sector, plan, amount,                          │  │
│  │   status: "pending",                                      │  │
│  │   created_at, flow_token                                  │  │
│  │ }                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ (Internet to Flow)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              FLOW PAYMENT GATEWAY (External Service)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. Payment/Create Endpoint                                │  │
│  │    POST https://sandbox.flow.cl/api/payment/create        │  │
│  │                                                            │  │
│  │    Receives:                                              │  │
│  │    - apiKey: Your merchant ID                             │  │
│  │    - commerceOrder: Unique order ID                       │  │
│  │    - amount: 1000 or 11000 CLP                            │  │
│  │    - email: Client email                                  │  │
│  │    - currency: 'CLP'                                      │  │
│  │    - urlReturn: Redirect after payment                    │  │
│  │    - urlConfirm: Webhook endpoint                         │  │
│  │    - s: SHA256 signature (authentication)                 │  │
│  │                                                            │  │
│  │    Verifies:                                              │  │
│  │    - Signature matches (using their copy of secret key)   │  │
│  │    - Amount is valid                                      │  │
│  │    - Merchant exists and is active                        │  │
│  │                                                            │  │
│  │    Returns:                                               │  │
│  │    {                                                      │  │
│  │      "status": "SUCCESS",                                 │  │
│  │      "token": "unique_payment_token",                     │  │
│  │      "url": "https://www.flow.cl/app/pay.php?token=..."  │  │
│  │    }                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Flow creates temporary payment session                    │  │
│  │ (stored in Flow's database, with 30-min expiry)          │  │
│  │                                                            │  │
│  │ Stores: token → { amount, commerceOrder, status, ... }   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ (Internet back to your site)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER (AGAIN)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 6. JavaScript receives paymentUrl from function response  │  │
│  │    Response: {                                            │  │
│  │      success: true,                                       │  │
│  │      paymentUrl: "https://www.flow.cl/app/pay.php?...",  │  │
│  │      orderId: "ACP-1779562155517-fde29459"                │  │
│  │    }                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 7. Browser redirects to Flow checkout page                │  │
│  │    window.location.href = paymentUrl                      │  │
│  │                                                            │  │
│  │    NOW ON FLOW'S SERVERS (NOT YOUR SITE)                  │  │
│  │    https://www.flow.cl/app/pay.php?token=...             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 8. Client enters payment details                          │  │
│  │    - Card number                                          │  │
│  │    - Expiry date                                          │  │
│  │    - CVV                                                  │  │
│  │    - Billing address                                      │  │
│  │                                                            │  │
│  │    ⚠️  You NEVER see card details (PCI compliant)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 9. Flow submits to Chilean banking system                │  │
│  │    - Processes payment                                    │  │
│  │    - Communicates with card issuer's bank                │  │
│  │    - Receives approval or decline                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ (Callback from Flow servers)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              NETLIFY BACKEND (WEBHOOK CALLBACK)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 10. flow-webhook.js (auto-triggered by Flow)              │  │
│  │     GET /.netlify/functions/flow-webhook                  │  │
│  │     ?token=...&commerceOrder=...&requestSignature=...    │  │
│  │                                                            │  │
│  │     Steps:                                                │  │
│  │     a. Extract parameters from URL query                 │  │
│  │     b. Recalculate signature to verify authenticity       │  │
│  │     c. Retrieve case from Blobs using commerceOrder       │  │
│  │     d. Update status to "pagado" (paid)                   │  │
│  │     e. Store flow_token and flow_reference                │  │
│  │     f. TRIGGER POST-PAYMENT ACTIONS:                      │  │
│  │        - Send questionnaire email                         │  │
│  │        - Generate diagnostic report (PDF)                 │  │
│  │        - Notify advisor of payment                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ (Internet back to Flow)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              FLOW SERVERS (Redirect after webhook)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 11. Flow receives webhook response (HTTP 200)             │  │
│  │     Redirects client to: /flow-success.html?orderId=...  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ (Back to your site)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER (SUCCESS PAGE)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 12. Successfully redirected to: /flow-success.html        │  │
│  │                                                            │  │
│  │     Displays:                                             │  │
│  │     - "Payment successful!" message                       │  │
│  │     - Order ID                                            │  │
│  │     - Amount paid                                         │  │
│  │     - Date and time                                       │  │
│  │     - Instructions to check email for questionnaire       │  │
│  │                                                            │  │
│  │     JavaScript fetches order details:                     │  │
│  │     GET /.netlify/functions/get-order-details?orderId=... │  │
│  │     (Shows: order data without sensitive fields)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │ (Automatic emails triggered)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│            EMAIL NOTIFICATIONS (Automatic)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 13a. Client receives questionnaire email                  │  │
│  │      From: noreply@acp-asociados.com (Resend)             │  │
│  │      To: client@example.com                               │  │
│  │      Content:                                             │  │
│  │      - Sector-specific questionnaire                      │  │
│  │      - Questions about operations, challenges, goals      │  │
│  │                                                            │  │
│  │ 13b. Advisor receives payment notification                │  │
│  │      From: system@acp-asociados.com (Resend)              │  │
│  │      To: asesor.pac@gmail.com                             │  │
│  │      Content:                                             │  │
│  │      - New payment received                               │  │
│  │      - Client details                                     │  │
│  │      - Plan and amount                                    │  │
│  │      - Link to review case                                │  │
│  │                                                            │  │
│  │ 13c. Diagnostic report generated (PDF)                    │  │
│  │      Using: Puppeteer                                     │  │
│  │      Template: templates/diagnostic-report-template.html  │  │
│  │      Output: Stored in Netlify Blobs                      │  │
│  │      Timeout: 26 seconds (configurable)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security: Why Signature Calculation Matters

### The Signature Algorithm (SHA256)

**Purpose:** Prevent tampering and authenticate requests

**Process:**
1. Sort parameters alphabetically
2. Concatenate key+value pairs
3. Append secret key (known only to you and Flow)
4. Calculate SHA256 hash

**Example with actual values:**

```
Step 1: Parameters received from client
{
  apiKey: "1F7ABDF2-7286-4261-9A54-963935CDCL2I",
  commerceOrder: "ACP-1779562155517-fde29459",
  subject: "Diagnóstico ACP - test",
  amount: 1000,
  email: "test@tes.com",
  currency: "CLP",
  urlConfirm: "https://acp-asociados.netlify.app/.netlify/functions/flow-webhook",
  urlReturn: "https://acp-asociados.netlify.app/flow-success.html?orderId=ACP-1779562155517-fde29459"
}

Step 2: Sort keys alphabetically
['amount', 'apiKey', 'commerceOrder', 'currency', 'email', 'subject', 'urlConfirm', 'urlReturn']

Step 3: Concatenate key + value
"amount" + "1000" +
"apiKey" + "1F7ABDF2-7286-4261-9A54-963935CDCL2I" +
"commerceOrder" + "ACP-1779562155517-fde29459" +
...
= "amount1000apiKey1F7ABDF2-7286-4261-9A54-963935CDCL2I..."

Step 4: Append secret key
secretString = "amount1000apiKey..." + "9ebebcc7a7929aac1472c21b75fb764522b6601d"

Step 5: Calculate SHA256
SHA256(secretString) = "75194e5ae0a7ad535dd216ffe6a55825fec557f8c121578ce957f2740b8b0404"

Step 6: Add signature to parameters
flowParams.s = "75194e5ae0a7ad535dd216ffe6a55825fec557f8c121578ce957f2740b8b0404"
```

### Why This Prevents Fraud

**Scenario 1: Attacker tries to change amount**
```
Attacker intercepts: amount=1000, s=75194e5a...
Attacker changes: amount=1 (pay less!)
s = 75194e5a... (unchanged)

Flow recalculates signature with amount=1 and gets different hash
Flow's calculation: sha256(...amount1...secret) = "abc123..."
Received signature: "75194e5a..."
MISMATCH! Request rejected with code 108: "Invalid Signature"
```

**Scenario 2: Your secret key is exposed**
```
Attacker steals: FLOW_SECRET_KEY = "9ebebcc7a7929aac..."
But Flow knows which merchant_id has which secret
Attacker can only forge requests FOR YOUR MERCHANT_ID
They can't forge requests as OTHER merchants
Flow tracks which apiKey made each signature
```

**Scenario 3: Webhook spoofing**
```
Attacker tries to send fake webhook confirming payment
Flow GET /.netlify/functions/flow-webhook?token=fake&requestSignature=fake
Your function recalculates signature
Signatures don't match
Webhook rejected, case status NOT updated to "pagado"
Fake payment notification prevented
```

---

## 🌐 Sandbox vs Production Environment

### Current Setup: Sandbox (Testing)

**What you have now:**
```
API Endpoint: https://sandbox.flow.cl/api/payment/create
API Key: 1F7ABDF2-7286-4261-9A54-963935CDCL2I
Secret Key: 9ebebcc7a7929aac1472c21b75fb764522b6601d

Characteristics:
✓ Free to use
✓ Unlimited test payments
✓ Test cards provided (4111 1111 1111 1111)
✓ Instant payment confirmation
✓ No real money charged
✓ Can test full payment flow end-to-end
✗ Cannot process real payments
✗ Cannot receive real customer funds
✗ Cannot withdraw funds
```

**Test Card Details:**
```
Card Number: 4111 1111 1111 1111
Expiry: Any future date (e.g., 12/25)
CVV: Any 3 digits (e.g., 123)
Name: Any name (e.g., "Test User")

Flow allows payment for any amount in sandbox mode
Payment always succeeds (unless invalid signature)
```

### Production Setup: Real Money

**What you'll need for production:**
```
API Endpoint: https://www.flow.cl/api/payment/create
API Key: (Different from sandbox - provided by Flow)
Secret Key: (Different from sandbox - provided by Flow)

Requirements to activate production:
1. Business registration (RUT - Rol Único Tributario)
2. Banking information (account number, bank name)
3. Business address verification
4. Email verification
5. Phone number verification
6. Flow's manual review and approval (1-2 business days)

Characteristics:
✓ Real money payments processed
✓ Funds received in your bank account
✓ Can withdraw earnings
✓ Live integration with Chilean banking system
✓ 24/7 payment processing
✗ Real charges to customer cards
✗ Real money at stake
✗ PCI compliance required
✗ Higher security standards
```

### Migration Checklist: Sandbox → Production

When ready to go live:

```
BEFORE switching credentials:
[ ] Obtain production API Key from Flow
[ ] Obtain production Secret Key from Flow
[ ] Test end-to-end in sandbox (10+ test transactions)
[ ] Verify all emails are sending
[ ] Verify webhooks are firing correctly
[ ] Verify case data is persisting in Blobs
[ ] Verify PDF reports generate correctly
[ ] Set up monitoring/logging for production

SWITCHING TO PRODUCTION:
[ ] Update FLOW_API_KEY in Netlify (Settings > Environment variables)
[ ] Update FLOW_SECRET_KEY in Netlify (Settings > Environment variables)
[ ] Update Flow API endpoint from sandbox.flow.cl to www.flow.cl
[ ] Force redeploy: netlify deploy --prod --trigger
[ ] Test with ONE real test transaction
[ ] Monitor logs for any errors
[ ] Verify payment confirmation webhook fires
[ ] Verify client receives confirmation email

AFTER GOING LIVE:
[ ] Monitor first 10 real transactions
[ ] Check advisor receives notifications
[ ] Verify funds arrive in bank account (24-48 hours)
[ ] Set up monitoring alerts for failed payments
[ ] Document production API keys securely
[ ] Enable webhook logging for debugging
[ ] Set up daily backup of Blobs storage
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid Signature" (Error 108)

**Symptoms:**
- Form submission returns 400 error from Flow
- Logs show: "Flow API Error: { code: 108, message: 'Invalid Signature' }"

**Root Causes:**
1. ❌ Wrong FLOW_SECRET_KEY in environment
2. ❌ FLOW_API_KEY doesn't match registered merchant
3. ❌ Parameters contain special characters that aren't encoded
4. ❌ Signature algorithm has a bug

**Solution:**
```bash
# Step 1: Verify credentials in Netlify
netlify env:list --json | grep FLOW

# Should output:
# "FLOW_API_KEY": "1F7ABDF2-7286-4261-9A54-963935CDCL2I",
# "FLOW_SECRET_KEY": "9ebebcc7a7929aac1472c21b75fb764522b6601d",

# Step 2: If wrong, update them
netlify env:set FLOW_API_KEY "1F7ABDF2-7286-4261-9A54-963935CDCL2I"
netlify env:set FLOW_SECRET_KEY "9ebebcc7a7929aac1472c21b75fb764522b6601d"

# Step 3: Force redeploy
netlify deploy --prod --trigger

# Step 4: Test form again
# Navigate to https://acp-asociados.netlify.app
# Fill form and click "Continuar al Pago"
# Check Netlify logs:
netlify logs --function=flow-create-payment --since=5m
```

### Issue 2: Webhook Never Fires

**Symptoms:**
- Payment appears successful (client sees success page)
- Case status never updates to "pagado"
- Emails not sent

**Root Causes:**
1. ❌ urlConfirm parameter is incorrect
2. ❌ Webhook function has an error
3. ❌ Signature verification failing (prevents webhook processing)

**Solution:**
```javascript
// In flow-create-payment.js, verify urlConfirm is correct:
const urlConfirm = `${SITE_URL}/.netlify/functions/flow-webhook`;
// Should be: https://acp-asociados.netlify.app/.netlify/functions/flow-webhook

// Check logs:
netlify logs --function=flow-webhook --since=30m

// Should see log lines like:
// "Webhook received with token: xxx"
// "Case updated to status: pagado"
// "Questionnaire email sent"
```

### Issue 3: Form Submission Stalls at "Continuar al Pago"

**Symptoms:**
- User clicks button
- Page shows loading spinner but never completes
- No error message shown

**Root Causes:**
1. ❌ Missing environment variables (PRICE_BASIC_CLP, PRICE_PREMIUM_CLP)
2. ❌ FLOW_API_KEY or FLOW_SECRET_KEY not defined
3. ❌ Function timeout (>10 seconds for Netlify Functions)
4. ❌ Network error calling Flow API

**Solution:**
```bash
# Check all required env vars are set:
netlify env:list --json | grep -E "FLOW|PRICE|SITE_URL"

# Should output:
# FLOW_API_KEY: (should have value)
# FLOW_SECRET_KEY: (should have value)  
# PRICE_BASIC_CLP: 1000
# PRICE_PREMIUM_CLP: 11000
# SITE_URL: https://acp-asociados.netlify.app

# Check function logs for timeouts:
netlify logs --function=flow-create-payment --since=5m

# Look for:
# - "Checking env vars - FLOW_API_KEY defined: false" (missing key)
# - "Function timed out" (taking too long)
# - Network errors calling Flow API
```

---

## 📋 How Flow Stores Your Payment Data

### In Netlify Blobs (Your Persistent Storage)

Each payment creates a **case record** stored in Netlify Blobs with key = orderId

**Example case data after payment:**
```json
{
  "id": "ACP-1779562155517-fde29459",
  "name": "Juan test",
  "email": "test@tes.com",
  "phone": "+56901234567",
  "company": "test",
  "sector": "gastronomia",
  "plan": "basico",
  "amount": 1000,
  "monthly_sales": "15000000",
  "profit_margin": "20",
  "active_clients": "20",
  "tax_regime": "simplificado",
  "top_costs": "combustible, payroll, costos",
  "digital_presence": "no",
  "tax_advisor": "",
  "main_challenge": "flujo_caja",
  "objectives_6m": "mejorar el flujo y mantener el margen",
  "status": "pagado",
  "created_at": "2026-05-23T18:49:13.511Z",
  "payment_created": "2026-05-23T18:49:15.516Z",
  "flow_token": "xxxxxxxxxxxxx",
  "paid_at": "2026-05-23T18:50:00.000Z",
  "flow_reference": "12345678",
  "questionnaire_sent_at": "2026-05-23T18:50:30.000Z",
  "report_generated_at": "2026-05-23T18:51:00.000Z",
  "report_url": "https://blobs-storage.netlify.app/cases/report-xxx.pdf"
}
```

**Data lifecycle:**
```
1. Customer fills form
   → Case created with status: "pending"
   → Stored in Blobs

2. Customer clicks "Continuar al Pago"
   → flow_token added
   → payment_created timestamp added
   → Still status: "pending"

3. Payment successful
   → Status updated to "pagado"
   → paid_at timestamp added
   → flow_reference saved

4. Webhook fires post-payment actions
   → questionnaire_sent_at (when email sent)
   → report_generated_at (when PDF created)
   → report_url (where PDF is stored)

5. Advisor reviews case
   → Case may be updated with advisor comments
   → Status may change to "approved" or "sent"
```

---

## 🎯 What You've Learned About Flow

### Key Characteristics

1. **Payment Flow**
   - Client submits form → Your function creates payment → Flow generates payment page → Client pays → Flow calls webhook → You update database

2. **Security Model**
   - Everything is signed with SHA256 HMAC
   - Your secret key is never sent over internet
   - Flow independently recalculates signature to verify requests

3. **Data Isolation**
   - You never see card numbers (PCI compliant)
   - You only see payment confirmation (token + amount)
   - Client data stays on your servers (Blobs)
   - Payment data stays on Flow servers

4. **Reliability**
   - Flow sends webhook even if client closes browser
   - Webhook retries if your endpoint is down
   - Webhook signature prevents spoofing

5. **Chilean Context**
   - CLP currency required
   - Works with Chilean banks and card issuers
   - Instant payment confirmation (sandbox & production)
   - Supports all major Chilean payment methods

### Integration Requirements

| Requirement | Your Implementation |
|---|---|
| API Authentication | ✅ FLOW_API_KEY in request |
| Request Signing | ✅ SHA256 signature calculation |
| Webhook Verification | ✅ Webhook signature validation |
| Data Persistence | ✅ Netlify Blobs for case storage |
| Post-Payment Automation | ✅ Questionnaire, report, notifications |
| Error Handling | ✅ Specific error codes (108 = signature) |
| Sandbox Testing | ✅ Using sandbox.flow.cl endpoint |

---

## ✅ Next Steps

1. **Test the payment flow:**
   - Navigate to: https://acp-asociados.netlify.app
   - Fill out the complete form
   - Click "Continuar al Pago"
   - You should see Flow checkout page load
   - (If using sandbox: Use test card 4111 1111 1111 1111)

2. **Monitor logs:**
   ```bash
   # Watch for successful payment creation
   netlify logs --function=flow-create-payment --follow
   
   # Watch for webhook confirmation
   netlify logs --function=flow-webhook --follow
   
   # Watch for email notifications
   netlify logs --function=send-questionnaire-email --follow
   ```

3. **Verify workflow:**
   - [ ] Form submits → payment created
   - [ ] Client redirected to Flow page
   - [ ] Payment confirmed → case status "pagado"
   - [ ] Webhook fires → questionnaire email sent
   - [ ] Advisor notified of payment
   - [ ] Report generated

4. **Prepare for production:**
   - Contact Flow to activate production account
   - Gather required documents (RUT, banking info, etc.)
   - Once approved, swap sandbox credentials for production
   - Force redeploy with new credentials
   - Test first 10 real transactions carefully

---

**Document Status:** ✅ Complete  
**Last Updated:** 2026-05-23  
**Sandbox Status:** Ready for testing (credentials updated)  
**Production Status:** Awaiting Flow account activation
