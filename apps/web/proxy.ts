import { NextRequest, NextResponse } from 'next/server';

/**
 * Rotas públicas — não exigem autenticação.
 * Tudo mais é considerado privado e exige access_token.
 */
const PUBLIC_PATHS = ['/', '/login', '/onboarding'];

/** Prefixos que nunca devem ser interceptados pelo proxy */
const BYPASS_PREFIXES = [
  '/api/',        // Route handlers do Next.js (inclui BFF de auth)
  '/_next/',      // Assets do Next.js
  '/favicon.ico',
];

function isPublic(pathname: string): boolean {
  if (BYPASS_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return PUBLIC_PATHS.some(p => pathname === p);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Verifica existência do cookie de access_token
  const token = req.cookies.get('access_token')?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica em todas as rotas exceto assets estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
