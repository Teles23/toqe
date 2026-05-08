import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

/** POST /api/auth/logout — revoga refresh token e limpa cookies */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // Tenta revogar no backend (best-effort — não falha se a API estiver offline)
  if (refreshToken) {
    try {
      const accessToken = req.cookies.get("access_token")?.value;
      await fetch(`${API}/auth/logout`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Ignora erros de rede — limpa os cookies de qualquer forma
    }
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });

  // Expira os cookies imediatamente
  res.cookies.set("access_token",  "", { maxAge: 0, path: "/" });
  res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });

  return res;
}
