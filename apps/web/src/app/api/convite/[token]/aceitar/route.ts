import { NextRequest, NextResponse } from "next/server";

/**
 * BFF — POST /api/convite/:token/aceitar
 *
 * Proxy para NestJS POST /convite/:token/aceitar (endpoint PÚBLICO, sem auth).
 * É um **auto-login**: a posse do link prova a identidade. O backend retorna
 * access/refresh tokens e o BFF os transforma em cookies — exatamente como o
 * BFF de login:
 *  - access_token  : httpOnly (nunca exposto ao JS), 15 min
 *  - refresh_token : httpOnly (nunca exposto ao JS), 30 dias, restrito a /api/auth
 *
 * O api-client.ts obtém o access_token via GET /api/auth/token (BFF server-side).
 *
 * Erros propagados do backend: 404 (expirado/inexistente), 409 (já utilizado),
 * 401 (senha incorreta), 400 (senha < 8 chars).
 */

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const reqBody = await req.json().catch(() => ({}));

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/convite/${token}/aceitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });
  } catch {
    return NextResponse.json(
      { message: "Serviço indisponível. Tente novamente em instantes." },
      { status: 503 },
    );
  }

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(
      {
        message:
          (data as { message?: string }).message ??
          "Não foi possível aceitar o convite.",
      },
      { status: apiRes.status },
    );
  }

  const body = data as {
    access_token: string;
    refresh_token: string;
    user: { codigo: number; nome: string; email: string };
    isNew: boolean;
    barbeariaNome: string;
  };

  const { access_token, refresh_token, user, isNew, barbeariaNome } = body;

  const res = NextResponse.json(
    { user, isNew, barbeariaNome },
    { status: 200 },
  );

  res.cookies.set("access_token", access_token, {
    httpOnly: true,
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
