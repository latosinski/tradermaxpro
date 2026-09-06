import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json(
      { ok: false, message: "Senha é obrigatória." },
      { status: 400 }
    );
  }

  const valid = verifyAdminPassword(password);

  if (!valid) {
    return NextResponse.json(
      { ok: false, message: "Senha incorreta." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, message: "Acesso liberado." });
}