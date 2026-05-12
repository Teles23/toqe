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
 * Solicita link de recuperação de senha.
 *
 * STUB: o endpoint correspondente ainda não está implementado no NestJS.
 * Quando estiver, substituir o `setTimeout` por uma chamada real ao BFF.
 */
export async function requestPasswordReset(_email: string): Promise<void> {
  // TODO: trocar por POST /api/auth/forgot-password quando o endpoint
  // estiver disponível na API.
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
