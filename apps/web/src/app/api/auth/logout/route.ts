import { NextRequest, NextResponse } from "next/server";

/**
 * BFF — POST /api/auth/logout
 *
 * Le refresh_token e access_token dos cookies, revoga o token na API
 * e limpa ambos os cookies do browser.
 */

const INTERNAL_API =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  const accessToken = req.cookies.get("access_token")?.value;

  if (refreshToken && accessToken) {
    try {
      await fetch(`${INTERNAL_API}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignora erros — limpa cookies de qualquer forma
    }
  }

  const res = NextResponse.json({ ok: true });

  const cookieOpts = {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: "strict" as const,
    maxAge: 0,
    path: "/",
  };

  res.cookies.set("access_token", "", { ...cookieOpts, maxAge: 0 });
  res.cookies.set("refresh_token", "", {
    ...cookieOpts,
    httpOnly: true,
    path: "/api/auth",
    maxAge: 0,
  });

  return res;
}
