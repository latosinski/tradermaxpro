import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { clientName, minutes } = body;

  if (!clientName || !minutes) {
    return NextResponse.json(
      { ok: false, message: "Nome do cliente e validade são obrigatórios." },
      { status: 400 }
    );
  }

  const allowedMinutes = [30, 60, 120];

  if (!allowedMinutes.includes(minutes)) {
    return NextResponse.json(
      { ok: false, message: "Validade inválida." },
      { status: 400 }
    );
  }

  const record = generateToken(minutes, clientName);

  return NextResponse.json({
    ok: true,
    message: "Token gerado com sucesso.",
    token: record.token,
    expiresAt: record.expiresAt,
  });
}