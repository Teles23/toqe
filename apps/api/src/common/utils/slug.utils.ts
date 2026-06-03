/**
 * Converte um texto em slug URL-safe: minúsculas, sem acentos, separado por
 * hífens. Ex.: "Carlos Mendes" → "carlos-mendes".
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (acentos)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Link público do barbeiro (compartilhável — ex.: bio do Instagram).
 * Derivado do nome; resolução da página pública é feature futura.
 */
export function linkPublicoBarbeiro(nome: string): string {
  const rawBase =
    process.env.PUBLIC_BOOKING_DOMAIN ?? 'https://app.toqe-barber.com.br';
  const base = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`;
  const slug = slugify(nome) || 'barbeiro';
  return `${base.replace(/\/$/, '')}/u/${slug}`;
}
