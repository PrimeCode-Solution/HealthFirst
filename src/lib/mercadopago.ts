import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';

if (!accessToken && process.env.NODE_ENV === 'production') {
  console.warn("[Mercado Pago] Warning: Access Token não configurado em produção!");
}

const client = new MercadoPagoConfig({ 
  accessToken,
  options: { 
    timeout: 3000,
  } 
});

export const paymentClient = new Payment(client);
export const preApprovalClient = new PreApproval(client);
export const MP_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

export default client;