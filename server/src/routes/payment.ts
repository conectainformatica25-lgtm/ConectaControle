import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const paymentRouter = Router();

const ASAAS_API = 'https://api.asaas.com/v3';

paymentRouter.post('/payments/pix', requireAuth, async (req, res, next) => {
  const { cid } = (req as AuthedRequest).auth;
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey) {
    res.status(400).json({ error: 'asaas_key_not_found', message: 'Chave do Asaas não configurada no servidor.' });
    return;
  }

  const asaasHeaders = {
    'access_token': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // 1. Criar cliente avulso no Asaas se necessário (Asaas obriga Customer para fazer cobrança)
    const custRes = await fetch(`${ASAAS_API}/customers`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify({
        name: 'Cliente ConectaControle Assinatura',
        cpfCnpj: '00000000000191'
      })
    });
    
    // Se falhar por CNPJ existente ou erro, tentamos resgatar o ID pelos erros, mas normalmente Asaas sempre cria ou atualiza,
    // porém se der erro 400 por "cpfCnpj already exists", a resposta de erro dele infelizmente não devolve o ID. 
    // Para simplificar, vou tentar buscar antes, se der erro. Mas o ideal é mandar um email provisório único.
    let customerId;
    const custData = await custRes.json();
    if (custRes.ok) {
      customerId = custData.id;
    } else {
      // Tentar buscar o customer por CPF/CNPJ se ele já existir
      const searchRes = await fetch(`${ASAAS_API}/customers?cpfCnpj=00000000000191`, { headers: asaasHeaders });
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        throw new Error('Falha ao criar/encontrar cliente no Asaas: ' + JSON.stringify(custData));
      }
    }

    // 2. Criar a cobrança PIX
    const today = new Date().toISOString().slice(0, 10);
    const payRes = await fetch(`${ASAAS_API}/payments`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: 39.99,
        dueDate: today,
        description: 'Assinatura Mensal ConectaControle (Empresa: ' + cid + ')'
      })
    });
    
    const payData = await payRes.json();
    if (!payRes.ok) {
      console.error('Asaas Payment Error:', payData);
      throw new Error('Erro ao gerar cobrança no Asaas: ' + (payData.errors?.[0]?.description || 'desconhecido'));
    }

    const paymentId = payData.id;

    // 3. Buscar o QR Code Base64
    const qrRes = await fetch(`${ASAAS_API}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: asaasHeaders
    });
    const qrData = await qrRes.json();
    if (!qrRes.ok) {
      console.error('Asaas QR Code Error:', qrData);
      throw new Error('Erro ao gerar QR Code: ' + (qrData.errors?.[0]?.description || 'desconhecido'));
    }

    // Retorna disfarçado de PagBank para não quebrar a lógica antiga do app
    res.json({
      id: paymentId,
      qr_codes: [
        {
          text: qrData.payload,
          links: [
            {
              rel: 'QRCODE.PNG',
              href: `data:image/png;base64,${qrData.encodedImage}`
            }
          ]
        }
      ]
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Erro inesperado no Pagamento' });
  }
});

paymentRouter.get('/payments/pix/status/:orderId', requireAuth, async (req, res, next) => {
  const { cid } = (req as AuthedRequest).auth;
  const { orderId } = req.params;
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey) {
    res.status(400).json({ error: 'asaas_key_not_found' });
    return;
  }

  try {
    const response = await fetch(`${ASAAS_API}/payments/${orderId}`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    if (response.ok) {
      if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);

        await pool.query(
          `UPDATE companies SET 
             status = 'active', 
             expires_at = $1 
           WHERE id = $2`,
          [newExpiry.toISOString(), cid]
        );
        
        res.json({ status: 'PAID', company_updated: true });
      } else {
        // Envia PENDING pra tudo que não for pago (vencido etc, frontend simplifica)
        res.json({ status: 'PENDING' }); 
      }
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    next(error);
  }
});
