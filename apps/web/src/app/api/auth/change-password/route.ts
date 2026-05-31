import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { INTERNAL_API } from "../../_lib/internal-api";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // Passa o refresh token para que o backend preserve a sessão atual
      // e revogue apenas as outras sessões (outros dispositivos).
      body: JSON.stringify({ ...body, refreshTokenAtual: refreshToken }),
    });
  } catch {
    return NextResponse.json(
      { message: "Serviço indisponível. Tente novamente em instantes." },
      { status: 503 },
    );
  }

  const data = await apiRes.json().catch(() => ({}));
  return NextResponse.json(
    {
      message:
        (data as { message?: string }).message ??
        (apiRes.ok ? "Senha alterada com sucesso." : "Erro ao alterar senha."),
    },
    { status: apiRes.status },
  );
}
