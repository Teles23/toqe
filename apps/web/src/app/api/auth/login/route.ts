import { NextRequest, NextResponse } from "next/server";

/**
 * BFF — POST /api/auth/login
 *
 * Faz proxy para NestJS POST /auth/login e seta cookies:
 *  - access_token  : nao-httpOnly (lido pelo api-client.ts via document.cookie), 15 min
 *  - refresh_token : httpOnly (nunca exposto ao JS), 30 dias, restrito a /api/auth
 */

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const reqBody = await req.json().catch(() => ({}));

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });
  } catch {
    return NextResponse.json(
      { message: "Servico indisponivel. Tente novamente em instantes." },
      { status: 503 },
    );
  }

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(
      {
        message:
          (data as { message?: string }).message ?? "Credenciais invalidas",
      },
      { status: apiRes.status },
    );
  }

  const body = data as {
    requiresTwoFa?: boolean;
    tempToken?: string;
    access_token?: string;
    refresh_token?: string;
    user?: { codigo: number; nome: string; email: string };
  };

  if (body.requiresTwoFa) {
    return NextResponse.json(
      { requiresTwoFa: true, tempToken: body.tempToken },
      { status: 200 },
    );
  }

  const { access_token, refresh_token, user } = body as {
    access_token: string;
    refresh_token: string;
    user: { codigo: number; nome: string; email: string };
  };

  const res = NextResponse.json({ user }, { status: 200 });

  res.cookies.set("access_token", access_token, {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: "strict",
    maxAge: 900,
    path: "/",
  });

  res.cookies.set("refresh_token", refresh_token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/api/auth",
  });

  return res;
}
