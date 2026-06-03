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

/** Lançado pelo login quando o usuário tem 2FA ativo — não é um erro real. */
export class TwoFaRequiredError extends Error {
  readonly tempToken: string;
  constructor(tempToken: string) {
    super("2fa-required");
    this.name = "TwoFaRequiredError";
    this.tempToken = tempToken;
  }
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export type LoginResult = { requiresTwoFa: true; tempToken: string } | void;

/**
 * Autentica via BFF. Se o usuário tem 2FA ativo, retorna
 * `{ requiresTwoFa: true, tempToken }`. Caso contrário, o BFF seta os
 * cookies e retorna void.
 */
export async function requestLogin(input: LoginInput): Promise<LoginResult> {
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

  const data = (await parseJsonSafe(res)) as {
    requiresTwoFa?: boolean;
    tempToken?: string;
  };
  if (data.requiresTwoFa) {
    return { requiresTwoFa: true, tempToken: data.tempToken! };
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

export async function requestChangePassword(
  senhaAtual: string,
  novaSenha: string,
): Promise<void> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Erro ao alterar senha",
      res.status,
    );
  }
}

export interface SessaoAtiva {
  codigo: number;
  criadoEm: string;
  expiraEm: string;
}

export async function fetchSessions(): Promise<SessaoAtiva[]> {
  const res = await fetch("/api/auth/sessions");
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Erro ao buscar sessões",
      res.status,
    );
  }
  return res.json() as Promise<SessaoAtiva[]>;
}

export async function revokeSession(codigo: number): Promise<void> {
  const res = await fetch(`/api/auth/sessions/${codigo}`, { method: "DELETE" });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Erro ao encerrar sessão",
      res.status,
    );
  }
}

export async function revokeAllSessions(): Promise<void> {
  const res = await fetch("/api/auth/sessions", { method: "DELETE" });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Erro ao encerrar sessões",
      res.status,
    );
  }
}

export async function requestGoogleLogin(idToken: string): Promise<LoginResult> {
  const res = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Erro ao autenticar com Google",
      res.status,
    );
  }
  const data = (await parseJsonSafe(res)) as {
    requiresTwoFa?: boolean;
    tempToken?: string;
  };
  if (data.requiresTwoFa) {
    return { requiresTwoFa: true, tempToken: data.tempToken! };
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const res = await fetch(
    `/api/auth/check-email?email=${encodeURIComponent(email)}`,
  );
  if (!res.ok) {
    return false;
  }
  const data = (await res.json()) as { exists: boolean };
  return data.exists;
}

export async function request2FaSetup(): Promise<{ qrCode: string }> {
  const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(
      data.message ?? "Erro ao configurar 2FA",
      res.status,
    );
  }
  return res.json() as Promise<{ qrCode: string }>;
}

export async function request2FaEnable(code: string): Promise<void> {
  const res = await fetch("/api/auth/2fa/enable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(data.message ?? "Código inválido", res.status);
  }
}

export async function request2FaDisable(code: string): Promise<void> {
  const res = await fetch("/api/auth/2fa/disable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(data.message ?? "Código inválido", res.status);
  }
}

export async function request2FaVerify(
  tempToken: string,
  code: string,
): Promise<void> {
  const res = await fetch("/api/auth/2fa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tempToken, code }),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new AuthServiceError(data.message ?? "Código inválido", res.status);
  }
}
