interface WhatsAppComponent {
  type: string;
  sub_type?: string;
  index?: string;
  parameters: Array<{
    type: string;
    text?: string;
    image?: { link: string };
  }>;
}

interface WhatsAppTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: WhatsAppComponent[];
}

export async function sendWhatsAppMessage({
  to,
  templateName,
  languageCode = "pt_BR",
  components,
}: WhatsAppTemplateParams) {
  const apiVersion = process.env.META_API_VERSION || "v21.0";
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!phoneId || !token) {
    console.error("❌ [WhatsApp Log] Erro: Credenciais ausentes no .env");
    return null;
  }

  let cleanPhone = to.replace(/\D/g, "");
  if (!cleanPhone.startsWith("55") && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
    cleanPhone = `55${cleanPhone}`;
  }
  
  const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components || [],
    },
  };

  console.log(`🚀 [WhatsApp Log] Enviando para ${cleanPhone} | Template: ${templateName}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [WhatsApp Log] ERRO NA API:", JSON.stringify(data, null, 2));
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ [WhatsApp Log] Falha crítica no fetch:", error);
    return null; 
  }
}

export async function sendAppointmentConfirmation(
  phone: string,
  patientName: string,
  dateAndHour: string
) {
  return sendWhatsAppMessage({
    to: phone,
    templateName: "confirmacao_agendamento",
    languageCode: "pt_BR",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: patientName },
          { type: "text", text: dateAndHour },
        ],
      },
    ],
  });
}

export async function sendAppointmentReminder(
  phone: string, 
  patientName: string, 
  dateAndHour: string, 
  doctorName: string
) {
  return sendWhatsAppMessage({
    to: phone,
    templateName: "lembrete_consulta_24h",
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: patientName },
          { type: "text", text: dateAndHour },
          { type: "text", text: doctorName }
        ]
      }
    ]
  });
}

export async function sendVideoLink(
  phone: string, 
  patientName: string, 
  fullVideoUrl: string
) {
  const roomName = fullVideoUrl.replace("https://meet.jit.si/", "");

  return sendWhatsAppMessage({
    to: phone,
    templateName: "link_videochamada_v2",
    components: [
      { 
        type: "body", 
        parameters: [
          { type: "text", text: patientName } 
        ] 
      },
      {
        type: "button",
        sub_type: "url",
        index: "0", 
        parameters: [
          { type: "text", text: roomName } 
        ]
      }
    ]
  });
}

export async function sendPendingPixMessage(
  phone: string,
  patientName: string,
  doctorName: string,
  pixCode: string, 
  pixQrCodeUrl: string 
) {
  return sendWhatsAppMessage({
    to: phone,
    templateName: "cobranca_pix_pendente",
    components: [
      {
        type: "header",
        parameters: [
          {
            type: "image",
            image: { link: pixQrCodeUrl } 
          }
        ]
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: patientName }, 
          { type: "text", text: doctorName },  
          { type: "text", text: pixCode }      
        ]
      }
    ]
  });
}