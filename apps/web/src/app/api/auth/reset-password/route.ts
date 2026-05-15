import { NextRequest, NextResponse } from "next/server";

/**
 * BFF — POST /api/auth/reset-password
 *
 * Proxy simples para NestJS POST /auth/reset-password.
 * Retorna erro 401 da API quando o token for inválido ou expirado.
 */

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Serviço indisponível. Tente novamente em instantes.",
      },
      { status: 503 },
    );
  }

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(
      {
        message:
          (data as { message?: string }).message ?? "Token inválido ou expirado.",
      },
      { status: apiRes.status },
    );
  }

  return NextResponse.json(
    {
      message:
        (data as { message?: string }).message ?? "Senha redefinida com sucesso.",
    },
    { status: 200 },
  );
}
