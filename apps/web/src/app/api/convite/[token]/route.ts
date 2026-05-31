import { NextRequest, NextResponse } from "next/server";
import { getInternalApiUrl } from "../../_lib/internal-api";

/**
 * BFF — convite de barbeiro (endpoints PÚBLICOS, sem auth).
 *
 *  - GET    /api/convite/:token  → proxy de GET /convite/:token (dados do convite)
 *  - DELETE /api/convite/:token  → proxy de DELETE /convite/:token (rejeitar; idempotente)
 *
 * O aceite (POST) vive em `aceitar/route.ts` porque precisa setar cookies de
 * sessão (auto-login), igual ao BFF de login.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let apiRes: Response;
  try {
    apiRes = await fetch(`${getInternalApiUrl()}/convite/${token}`);
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
          "Convite inválido ou expirado.",
      },
      { status: apiRes.status },
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let apiRes: Response;
  try {
    apiRes = await fetch(`${getInternalApiUrl()}/convite/${token}`, {
      method: "DELETE",
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
          (data as { message?: string }).message ?? "Erro ao rejeitar convite.",
      },
      { status: apiRes.status },
    );
  }

  return NextResponse.json(data, { status: 200 });
}
