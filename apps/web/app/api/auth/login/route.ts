import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const COOKIE_OPTS = {
  httpOnly:  true,
  secure:    process.env.NODE_ENV === "production",
  sameSite:  "strict" as const,
  path:      "/",
};

/** POST /api/auth/login — autentica e seta cookies httpOnly */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.senha) {
    return NextResponse.json({ message: "E-mail e senha são obrigatórios" }, { status: 400 });
  }

  const upstream = await fetch(`${API}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email: body.email, senha: body.senha }),
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      { message: (data as { message?: string }).message ?? "Credenciais inválidas" },
      { status: upstream.status },
    );
  }

  const { access_token, refresh_token } = data as {
    access_token:  string;
    refresh_token: string;
  };

  const res = NextResponse.json({ ok: true }, { status: 200 });

  // Access token: 15 min (mesmo TTL do JWT)
  res.cookies.set("access_token", access_token, {
    ...COOKIE_OPTS,
    maxAge: 60 * 15,
  });

  // Refresh token: 30 dias
  res.cookies.set("refresh_token", refresh_token, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
