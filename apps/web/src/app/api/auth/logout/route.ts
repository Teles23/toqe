import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_API } from "../../_lib/internal-api";

/**
 * BFF — POST /api/auth/logout
 *
 * Le refresh_token e access_token dos cookies, revoga o token na API
 * e limpa ambos os cookies do browser.
 */

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

  res.cookies.set("access_token", "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "strict",
    maxAge: 0,
    path: "/api/auth",
  });

  return res;
}
