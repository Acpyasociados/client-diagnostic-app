# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ACP Diagnostic System** - A semi-automated client diagnostic platform that guides customers through a multi-step form, processes payment via Mercado Pago, sends questionnaires by industry/sector, generates diagnostic reports, and provides human review workflows.

### Core User Flow
1. Client completes initial diagnostic form (`index.html`)
2. System creates case and initiates Mercado Pago checkout
3. Payment webhook marks case as "paid"
4. Client receives sector-specific questionnaire via email
5. System generates draft report using Puppeteer
6. Advisor reviews and approves report in admin UI
7. Client receives final diagnostic report via email

## Architecture

### Frontend
- **index.html** (728 lines) - Single-page form with 5 sections
- Form uses `fetch()` to POST to `/.netlify/functions/create-diagnostic-order`
- Form method MUST be POST (not GET) to avoid exposing sensitive data in URLs
- Phone field validates Chilean format with regex: `^\+56\s?9\s?\d{4}\s?\d{4}$`

### Backend - Netlify Functions
Located in `netlify/functions/`:

**Core Flow Functions:**
- `create-diagnostic-order.js` - Receives form, creates case, initiates Mercado Pago
- `mercadopago-webhook.js` - Handles payment callbacks
- `generate-report.js` - Creates PDF reports using Puppeteer (timeout: 26s)
- `submit-questionnaire.js` - Stores client responses

**Admin Functions:**
- `get-review-case.js` - Fetches case for review
- `approve-and-send.mts` - Advisor approval workflow

### Data Storage
- **Netlify Blobs** - Serverless object storage for case data (JSON)
- **SendGrid/Resend** - Email notifications

## Critical Environment Variables

**MUST be configured in Netlify > Site settings > Environment variables:**

```
SITE_URL=https://acp-asociados.netlify.app
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
PRICE_BASIC_CLP=1 (minimum, can be higher)
PRICE_PREMIUM_CLP=11 (minimum, can be higher)
SENDGRID_API_KEY=SG... or RESEND_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@example.com
ADVISOR_EMAIL=advisor@example.com
MERCADO_PAGO_WEBHOOK_SECRET=...
```

⚠️ **CRITICAL**: Missing `PRICE_BASIC_CLP` or `PRICE_PREMIUM_CLP` causes "Failed to fetch" error during form submission.

## Common Development Tasks

### Deployment
```bash
# Push to GitHub - Netlify auto-deploys
git push origin main

# Manual redeploy via CLI:
netlify deploy --prod
```

### Form Testing Checklist
1. ✅ Phone validates Chilean format (+56 9 XXXX XXXX)
2. ✅ Form uses POST (not GET)
3. ✅ All env vars configured (especially PRICE_*_CLP)
4. ✅ Form submission reaches create-diagnostic-order
5. ✅ Mercado Pago payment page loads
6. ✅ Webhook processes payment

### Debugging
```bash
# View function logs:
netlify logs --function=create-diagnostic-order

# Test function locally:
netlify dev
```

## Known Issues & Solutions

### "Failed to fetch" on Form Submission
**Cause:** Missing `PRICE_BASIC_CLP` or `PRICE_PREMIUM_CLP` env vars  
**Fix:** Add to Netlify environment and redeploy

### Phone Validation Not Working
**Fix:** Ensure phone input has `pattern="^\+56\s?9\s?\d{4}\s?\d{4}$"`

### Form Data in URL
**Cause:** Form method="get" instead of "post"  
**Fix:** Use `method="post"` on form tag

### Dropdown Selections Not Visual
**Note:** Selections may not visually update but are registered. Use form_input tool for reliable dropdown setting.

## Code Organization

- **No build step** - Netlify auto-deploys static + functions
- **Node 18+** runtime
- **Bundler:** NFT (Node File Tracer)
- **Timeout for generate-report:** 26 seconds (in netlify.toml)
- **All routes** redirect to `/` (single-page app)

## Security

1. Never commit `.env` - use Netlify UI for secrets
2. POST method only (never GET for sensitive data)
3. Webhook signature validation with `MERCADO_PAGO_WEBHOOK_SECRET`
4. Admin token protects approval endpoint
5. Phone regex validates input format

## Before Production

- [ ] Test form end-to-end with Mercado Pago test account
- [ ] Verify advisor receives notification email
- [ ] Check questionnaire email delivery
- [ ] Generate sample PDF and validate quality
- [ ] Test webhook with test payment
- [ ] All env vars set in Netlify

## Claude Code Autonomy Configuration

**EXECUTE WITHOUT ASKING:**
- ✅ Git commits and pushes
- ✅ Redeploys to Netlify (production)
- ✅ Code modifications and improvements
- ✅ Tests and validations
- ✅ Documentation updates
- ✅ Configuration changes (netlify.toml, env vars)

**ASK FIRST (never auto-execute):**
- ❌ Tests with real money
- ❌ Credential changes
- ❌ Irreversible actions (data deletion)
- ❌ Critical architecture changes

---
**Last Updated:** 2026-05-23  
**Autonomy Configured:** 2026-05-23  
**Architecture:** Netlify Functions (serverless) + Blobs (storage) + Resend (email) + Flow (payments)
