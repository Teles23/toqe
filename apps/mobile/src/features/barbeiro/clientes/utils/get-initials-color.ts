/**
 * Helpers puros para `ClienteAvatar`.
 *
 * Mantidos em `features/barbeiro/clientes/utils` para ficarem testáveis sem
 * RN/renderer e reutilizáveis em outros pontos do app (lista de clientes,
 * header do perfil do barbeiro, badges em ticket).
 */

/**
 * Paleta de fundos para avatares de iniciais — variações *Dim* da paleta
 * Urban Flow. Evita azul "genérico SaaS" — fica coerente com a identidade
 * âmbar/verde/teal escura.
 */
const COLORS = [
  "#2a1f00", // âmbar escuro (primaryDim)
  "#1a2e00", // verde escuro
  "#1a1a2e", // azul escuro (info muito apagado)
  "#2a0a1a", // vinho escuro
  "#0a2a2a", // teal escuro
] as const;

/**
 * Mapeia um nome para uma das cores da paleta via hash simples.
 *
 * Determinístico: o mesmo nome retorna sempre a mesma cor — útil porque
 * o cliente "Carlos" sempre tem o mesmo fundo em qualquer lugar do app
 * (visualmente memorável, mesmo sem foto).
 */
export function getInitialsColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

/**
 * Extrai até 2 iniciais maiúsculas de um nome.
 *
 * - "Marcos Silva" → "MS"
 * - "Ana"          → "A"
 * - ""             → ""
 * - "carlos teles oliveira" → "CT" (limita a 2 palavras)
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Exposição da lista de cores para teste de cobertura completa. */
export const INITIALS_COLORS = COLORS;
