import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { ok: false, message: "Token é obrigatório." },
      { status: 400 }
    );
  }

  const result = validateToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    downloadUrl: "/downloads/tradermaxpro.exe",
  });
}