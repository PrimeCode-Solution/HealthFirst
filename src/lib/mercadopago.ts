import { MercadoPagoConfig, 
    Payment, 
    PreApproval, 
    Preference } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.warn("[Mercado Pago] Access Token não encontrado. Verifique as variáveis de ambiente.");
}

export const mpClient = new MercadoPagoConfig({ 
  accessToken: accessToken || '', 
  options: { timeout: 10000 } 
});

export const paymentClient = new Payment(mpClient);
export const preApprovalClient = new PreApproval(mpClient);
export const preferenceClient = new Preference(mpClient);