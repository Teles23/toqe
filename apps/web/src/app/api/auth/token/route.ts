import { NextRequest, NextResponse } from "next/server";

/**
 * BFF — GET /api/auth/token
 *
 * Lê o access_token do cookie httpOnly (inacessível ao JS do browser) e o
 * retorna no body JSON para que o api-client.ts possa incluí-lo no header
 * Authorization sem nunca expô-lo via document.cookie.
 *
 * Este endpoint é chamado apenas pelo próprio domínio (SameSite=strict), por
 * isso não há risco de CSRF: a resposta só é útil para código rodando na
 * mesma origem.
 */
export function GET(req: NextRequest): NextResponse {
  const token = req.cookies.get("access_token")?.value ?? null;
  const canRefresh = !!req.cookies.get("refresh_token")?.value;
  return NextResponse.json({ token, canRefresh });
}
