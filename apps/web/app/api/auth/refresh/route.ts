import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path:     "/",
};

/** POST /api/auth/refresh — rotaciona os tokens via cookie httpOnly */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Sem refresh token" }, { status: 401 });
  }

  const upstream = await fetch(`${API}/auth/refresh`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => null);

  if (!upstream?.ok) {
    // Refresh falhou — limpa cookies e força novo login
    const res = NextResponse.json({ message: "Sessão expirada" }, { status: 401 });
    res.cookies.set("access_token",  "", { maxAge: 0, path: "/" });
    res.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    return res;
  }

  const data = await upstream.json() as {
    access_token:  string;
    refresh_token: string;
  };

  const res = NextResponse.json({ ok: true }, { status: 200 });

  res.cookies.set("access_token", data.access_token, {
    ...COOKIE_OPTS,
    maxAge: 60 * 15,
  });

  res.cookies.set("refresh_token", data.refresh_token, {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
