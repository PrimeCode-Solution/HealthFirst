import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    throw new Error("Falha ao enviar e-mail");
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: sans-serif; background-color: #f8fafc; padding: 50px 0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="padding: 40px 20px; text-align: center; background-color: #ffffff;">
            <div style="display: inline-block; padding: 10px 20px; border-radius: 8px; background-color: #f1f5f9;">
               <span style="font-size: 24px; font-weight: bold; color: #0f172a;">Health<span style="color: #30e696;">First</span></span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 40px 40px 40px;">
            <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px; text-align: center;">Recuperação de Acesso</h2>
            <p style="color: #475569; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 32px;">
              Recebemos uma solicitação para alterar sua senha. Utilize o código de verificação abaixo para continuar:
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="display: inline-block; background-color: #f0fdf4; border: 1px solid #30e696; border-radius: 12px; padding: 24px 40px;">
                <span style="font-size: 32px; font-weight: 800; color: #059669; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">${token}</span>
              </div>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px;">
              Ou clique no botão abaixo para ser redirecionado automaticamente:
            </p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" style="background-color:rgb(0, 255, 115); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
              Este código é válido por 60 minutos. Se você não solicitou esta redefinição, ignore este e-mail por segurança.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} HealthFirst. Todos os direitos reservados.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Código de Verificação - HealthFirst",
    html,
  });
}