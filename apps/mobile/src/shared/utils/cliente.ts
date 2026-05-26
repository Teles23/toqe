/**
 * Helpers de apresentação de cliente.
 *
 * O backend exige `email` @unique NOT NULL, então clientes sem e-mail real
 * (walk-in/encaixe ou cadastro manual sem e-mail) recebem um e-mail SINTÉTICO
 * gerado server-side — ex.: `encaixe-1-...@toqe.internal`. Esses e-mails são
 * detalhe de implementação e NÃO devem aparecer na UI.
 */

const SYNTHETIC_EMAIL_DOMAINS = ["@toqe.internal", "@walk-in.local"];

/**
 * Retorna o e-mail apenas quando é "real" (exibível). Para e-mails sintéticos,
 * vazios ou nulos retorna `null` — a UI deve cair no telefone ou em nada.
 */
export function emailVisivel(email: string | null | undefined): string | null {
  if (!email) return null;
  const normalizado = email.trim().toLowerCase();
  if (!normalizado) return null;
  if (SYNTHETIC_EMAIL_DOMAINS.some((d) => normalizado.endsWith(d))) return null;
  return email;
}
