import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_API } from "../../_lib/internal-api";

/**
 * BFF — POST /api/auth/forgot-password
 *
 * Proxy simples para NestJS POST /auth/forgot-password.
 * Sempre retorna 200 mesmo se o e-mail não existir (anti-enumeration).
 * Se a API retornar outro erro (ex: 400 de validação), repassa o status real.
 */

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      {
        message: "Serviço indisponível. Tente novamente em instantes.",
      },
      { status: 503 },
    );
  }

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(
      {
        message:
          (data as { message?: string }).message ??
          "Erro ao processar solicitação.",
      },
      { status: apiRes.status },
    );
  }

  return NextResponse.json(
    {
      message:
        (data as { message?: string }).message ??
        "Se o e-mail estiver cadastrado, você receberá um link em breve.",
    },
    { status: 200 },
  );
}
