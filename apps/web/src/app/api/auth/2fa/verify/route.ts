import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_API } from "../../../_lib/internal-api";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  let apiRes: Response;
  try {
    apiRes = await fetch(`${INTERNAL_API}/auth/2fa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { message: "Serviço indisponível." },
      { status: 503 },
    );
  }

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok) {
    return NextResponse.json(
      { message: (data as { message?: string }).message ?? "Código inválido" },
      { status: apiRes.status },
    );
  }

  const { access_token, refresh_token } = data as {
    access_token: string;
    refresh_token: string;
  };

  const res = NextResponse.json({ ok: true });

  res.cookies.set("access_token", access_token, {
    httpOnly: true,
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
