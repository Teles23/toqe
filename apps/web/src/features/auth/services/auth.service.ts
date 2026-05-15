/**
 * Auth service — chamadas HTTP para o BFF (Next.js route handlers em
 * `src/app/api/auth/*`), que fazem proxy para o NestJS e gerenciam
 * cookies httpOnly do refresh-token.
 *
 * Mantemos o service "magro": ele só faz fetch e parseia respostas.
 * O gerenciamento de estado (user, barbearia, perfil) fica no
 * `AuthProvider`. Os hooks `useLogin`/`useLogout` em `../hooks/`
 * compõem service + provider via TanStack Query.
 */

import type { LoginInput } from "@toqe/contracts";

/** Erro de autenticação tipado (substitui o `throw new Error` genérico). */
export class AuthServiceError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthServiceError";
    this.status = status;
  }
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Autentica via BFF. O BFF seta os cookies httpOnly (refresh_token) e
 * o cookie de access_token; este service não retorna tokens — o
 * `AuthProvider` pode chamar `getCurrentUser()` em seguida.
 */
export async function requestLogin(input: LoginInput): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Credenciais inválidas",
      res.status,
    );
  }
}

/** Encerra a sessão no BFF (limpa cookies httpOnly e revoga refresh-token). */
export async function requestLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/**
 * Solicita link de recuperação de senha via BFF → NestJS.
 * Não revela se o e-mail existe (anti-enumeration): sempre retorna sem erro
 * em caso de sucesso 200.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Erro ao solicitar recuperação",
      res.status,
    );
  }
}

/**
 * Redefine a senha usando o token recebido por e-mail.
 * Lança AuthServiceError com status 401 se o token for inválido ou expirado.
 */
export async function requestResetPassword(
  token: string,
  novaSenha: string,
): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, novaSenha }),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Token inválido ou expirado",
      res.status,
    );
  }
}
