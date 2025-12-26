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
    console.log("E-mail enviado: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw new Error("Falha ao enviar e-mail");
  }
}

// Função específica para o e-mail de recuperação de senha
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0070f3;">Recuperação de Senha - HealthFirst</h2>
      <p>Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova:</p>
      <a href="${resetLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Redefinir Senha</a>
      <p style="color: #666; font-size: 14px;">Se você não solicitou isso, apenas ignore este e-mail.</p>
      <p style="color: #666; font-size: 12px;">Este link expira em 1 hora.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Redefinição de Senha - HealthFirst",
    html,
  });
}