import { MercadoPagoConfig, Preference } from "mercadopago";
import {PreferenceRequest} from "mercadopago/dist/clients/preference/commonTypes";
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN as string,
});

const preferenceClient =  new Preference(client);

export async function POST(req: Request){
   
    try{
      const body = await req.json();

      if(!body.id || !body.title || !body.unit_price){
        return new Response(
            JSON.stringify({ error: "Dados incompletos!"}),
            {status: 400, headers: { "Content-Type": "application/json" }}
        );
      }

       const preference: PreferenceRequest = {
        items: [
        {
            id:body.id,
            title: body.title,
            unit_price: Number(body.unit_price),
            currency_id: "BRL",
            quantity: body.quantity || 1,
        },
        ],

        back_urls: {
            success: `${process.env.BASE_URL || 'http://localhost:3000'}/success`,
            failure: `${process.env.BASE_URL || 'http://localhost:3000'}/failure`,
            pending: `${process.env.BASE_URL || 'http://localhost:3000'}/pending`,
        },

        auto_return: "approved",

        metadata: {
            agendamentoId: body.id,
            userId: body.userId
        }        
      };

   const response = await preferenceClient.create({body: preference});
   
   await prisma.payment.create({
    data: {
        appointmentId: body.id,
        preferenceId: response.id,
        amount: Number (body.unit_price),
        status: "PENDING",
        payerEmail: body.payerEmail,
        payerName: body.payerName,
        payerPhone: body.payerPhone,
        description: body.description,
        currency: body.currency
        
    },
   });

   return new Response(
    JSON.stringify({
    preferenceId: response.id,
    initPoint: response.init_point,
   }),
   
     {status: 200,
        headers: {"Content-Type": "application/json"}
     }
    )
   

   }catch(error){
    const mensagem = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
    JSON.stringify({ error: mensagem }),
    {status: 500, 
    headers: { "Content-Type": "application/json"}
      
    }
   );
   }    
}