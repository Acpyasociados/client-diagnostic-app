import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let htmlContent = '';
try {
    htmlContent = fs.readFileSync('./public/index.html', 'utf8');
} catch (e) {
    console.warn('No se pudo leer index.html:', e.message);
}

app.get('/', (req, res) => {
    if (htmlContent) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.send(htmlContent);
    } else {
          res.json({ message: 'ACP Backend operativo', status: 'running' });
    }
});

app.get('/api/', (req, res) => {
    res.json({ message: 'ACP Backend operativo', status: 'running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/submit-lead', async (req, res) => {
    const body = req.body;
    const requiredFields = ['name', 'email', 'phone', 'company', 'sector', 'monthly_sales', 'margin', 'active_clients', 'top_costs', 'main_channel', 'main_problem', 'goal_6m', 'plan'];

           for (const field of requiredFields) {
                 if (!body[field] && body[field] !== 0 && body[field] !== '0') {
                         return res.status(400).json({ error: `Falta campo: ${field}` });
                 }
           }

           const leadId = 'lead-' + Math.random().toString(36).substr(2, 9);
    const lead = { lead_id: leadId, ...body, created_at: new Date().toISOString() };

           try {
                 const mpResponse = await createMercadoPagoPreference(lead);
                 lead.checkout_url = mpResponse.data.init_point;
           } catch (e) {
                 console.error('MP Error:', e.message);
           }

           return res.status(200).json({
                 success: true,
                 lead_id: leadId,
                 checkout_url: lead.checkout_url || 'https://checkout.mercadopago.com'
           });
});

async function createMercadoPagoPreference(lead) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN');

  const basePrices = { basico: 49900, premium: 149900 };
    const basePrice = basePrices[lead.plan] || 49900;

  const response = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
    {
            items: [{ title: `Diagnostico ${lead.plan}`, quantity: 1, currency_id: 'CLP', unit_price: basePrice }],
            back_urls: { success: 'https://acp.example.com/success' }
    },
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
    return response.data;
}

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
    console.log(`Formulario disponible en /`);
});
