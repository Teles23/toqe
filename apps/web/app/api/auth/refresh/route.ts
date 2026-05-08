import { NextRequest, NextResponse } from "next/server";

/**
 * BFF — POST /api/auth/refresh
 *
 * Le refresh_token do cookie httpOnly, chama a API para rotar os tokens
 * e atualiza ambos os cookies com os novos valores.
 */

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Sem refresh token" }, { status: 401 });
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json(
      { message: "Servico indisponivel." },
      { status: 503 }
    );
  }

  if (!apiRes.ok) {
    // Refresh invalido — limpa cookies
    const res = NextResponse.json(
      { message: "Sessao expirada" },
      { status: 401 }
    );
    res.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    res.cookies.set("refresh_token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/api/auth",
    });
    return res;
  }

  const { access_token, refresh_token } = (await apiRes.json()) as {
    access_token: string;
    refresh_token: string;
  };

  const res = NextResponse.json({ ok: true });

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
