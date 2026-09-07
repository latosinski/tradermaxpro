import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const nome = formData.get("nome")?.toString() || "";
  const email = formData.get("email")?.toString() || "";
  const whatsapp = formData.get("whatsapp")?.toString() || "";
  const mensagem = formData.get("mensagem")?.toString() || "";
  const url = formData.get("url")?.toString() || "";

  // Honeypot anti-spam
  if (url) {
    return NextResponse.json({ ok: true, mensagem: "Mensagem enviada." });
  }

  if (!nome || !email) {
    return NextResponse.json(
      { ok: false, mensagem: "Nome e e-mail são obrigatórios." },
      { status: 400 }
    );
  }

  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const EMAIL_TO = process.env.EMAIL_TO;

  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.error("Variáveis de ambiente do e-mail não configuradas.");
    return NextResponse.json(
      { ok: false, mensagem: "Erro de configuração do servidor." },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_TO,
    replyTo: email,
    subject: `Contato TraderMaxPro - ${nome}`,
    text: `
Nome: ${nome}
E-mail: ${email}
WhatsApp: ${whatsapp || "Não informado"}

Mensagem:
${mensagem}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({
      ok: true,
      mensagem: "Mensagem enviada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return NextResponse.json(
      { ok: false, mensagem: "Erro ao enviar mensagem. Tente novamente." },
      { status: 500 }
    );
  }
}