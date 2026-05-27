/**
 * Convite service — chamadas HTTP para o BFF (`src/app/api/convite/*`), que
 * faz proxy para o NestJS (endpoints públicos) e, no aceite, gerencia os
 * cookies de sessão (auto-login).
 *
 * Mantemos o service "magro": só faz fetch e parseia respostas. O estado
 * global (AuthProvider) é populado pela tela via `establishSession()` após o
 * aceite. Os hooks em `../hooks/` compõem service + provider via TanStack Query.
 */

/** Erro de convite tipado — carrega o status HTTP para a UI mapear a mensagem. */
export class ConviteServiceError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ConviteServiceError";
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

/** Dados públicos do convite — espelha o contrato de `GET /convite/:token`. */
export interface ConviteData {
  token: string;
  barbeariaNome: string;
  barbeariaSlug: string;
  email: string;
  /** ex: 'barbeiro' */
  perfil: string;
  /** ISO string */
  expiresAt: string;
  /** `true` se o e-mail ainda não tem conta (pede nome + senha). */
  isNew: boolean;
}

/** Resultado do aceite — o BFF já setou os cookies; aqui só vem o resumo. */
export interface AceitarConviteResult {
  user: { codigo: number; nome: string; email: string };
  isNew: boolean;
  barbeariaNome: string;
}

/**
 * Busca os dados de um convite. Lança `ConviteServiceError` em 404/401
 * (convite inválido ou expirado) — a tela decide exibir o estado "expirado".
 */
export async function fetchConvite(token: string): Promise<ConviteData> {
  const res = await fetch(`/api/convite/${encodeURIComponent(token)}`);
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new ConviteServiceError(
      data.message ?? "Convite inválido ou expirado.",
      res.status,
    );
  }
  return res.json() as Promise<ConviteData>;
}

/**
 * Aceita o convite (auto-login). O BFF seta os cookies de sessão; o chamador
 * deve em seguida chamar `establishSession()` para popular o estado global.
 *
 * Erros: 404 (expirado/inexistente), 409 (já utilizado), 401 (senha incorreta),
 * 400 (senha < 8 chars).
 */
export async function requestAceitarConvite(
  token: string,
  input: { nome?: string; senha?: string },
): Promise<AceitarConviteResult> {
  const res = await fetch(`/api/convite/${encodeURIComponent(token)}/aceitar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new ConviteServiceError(
      data.message ?? "Não foi possível aceitar o convite.",
      res.status,
    );
  }
  return res.json() as Promise<AceitarConviteResult>;
}

/**
 * Rejeita o convite — remove o token no backend (não cria conta/vínculo).
 * Idempotente.
 */
export async function requestRejeitarConvite(token: string): Promise<void> {
  const res = await fetch(`/api/convite/${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = (await parseJsonSafe(res)) as { message?: string };
    throw new ConviteServiceError(
      data.message ?? "Erro ao rejeitar convite.",
      res.status,
    );
  }
}
