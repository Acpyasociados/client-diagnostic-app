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
        lead.checkout_url = mpResponse.init_point;
    } catch (e) {
        console.error('MP Error:', e.message);
    }

    // Enviar email al asesor
    try {
        await sendAdvisorEmail(lead);
        console.log('Email enviado exitosamente a', process.env.ADVISOR_EMAIL);
    } catch (e) {
        console.error('Email Error:', e.message);
        // No bloquear respuesta si falla email
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

async function sendAdvisorEmail(lead) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const advisorEmail = process.env.ADVISOR_EMAIL || 'asesor.pac@gmail.com';
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || advisorEmail;

    if (!apiKey) throw new Error('Falta SENDGRID_API_KEY');

    const emailContent = `
        <h2>Nuevo Lead Recibido</h2>
        <p><strong>ID del Lead:</strong> ${lead.lead_id}</p>
        <p><strong>Nombre:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Teléfono:</strong> ${lead.phone}</p>
        <p><strong>Empresa:</strong> ${lead.company}</p>
        <p><strong>Rubro:</strong> ${lead.sector}</p>
        <p><strong>Ventas mensuales:</strong> $${lead.monthly_sales}</p>
        <p><strong>Margen:</strong> ${lead.margin}%</p>
        <p><strong>Clientes activos:</strong> ${lead.active_clients}</p>
        <p><strong>Costos principales:</strong> ${lead.top_costs}</p>
        <p><strong>Canal principal:</strong> ${lead.main_channel}</p>
        <p><strong>Problema principal:</strong> ${lead.main_problem}</p>
        <p><strong>Objetivo a 6 meses:</strong> ${lead.goal_6m}</p>
        <p><strong>Plan elegido:</strong> ${lead.plan}</p>
        <p><strong>URL de Checkout:</strong> ${lead.checkout_url || 'Pendiente'}</p>
        <p><strong>Creado:</strong> ${lead.created_at}</p>
    `;

    const payload = {
        personalizations: [
            {
                to: [{ email: advisorEmail }],
                subject: `Nuevo Lead: ${lead.name} - ${lead.company}`
            }
        ],
        from: { email: fromEmail, name: 'ACP Diagnóstico' },
        content: [
            {
                type: 'text/html',
                value: emailContent
            }
        ]
    };

    try {
        const response = await axios.post(
            'https://api.sendgrid.com/v3/mail/send',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        console.log('SendGrid Response Status:', response.status);
        return response.data;
    } catch (error) {
        console.error('SendGrid Error:', {
            status: error.response?.status,
            message: error.response?.data?.errors || error.message
        });
        throw error;
    }
}

app.listen(PORT, () => {
    console.log(`Servidor ACP Backend escuchando en puerto ${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`SendGrid configurado: ${!!process.env.SENDGRID_API_KEY}`);
    console.log(`Mercado Pago configurado: ${!!process.env.MERCADOPAGO_ACCESS_TOKEN}`);
});
