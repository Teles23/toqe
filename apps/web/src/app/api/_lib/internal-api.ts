/**
 * URL interna da API NestJS usada pelos BFF route handlers.
 *
 * INTERNAL_API_URL é obrigatória em produção — aponta para o NestJS dentro
 * da rede privada (ex: http://api:3000/api/v1). NEXT_PUBLIC_API_URL só é
 * usada como fallback em desenvolvimento.
 *
 * A resolução é lazy (chamada na request, não no carregamento do módulo)
 * para não quebrar o next build em ambientes sem a variável configurada.
 */
export function getInternalApiUrl(): string {
  const url =
    process.env.INTERNAL_API_URL ??
    (process.env.NODE_ENV !== "production"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1")
      : null);

  if (!url) {
    throw new Error(
      "INTERNAL_API_URL is required in production but is not set. " +
        "Configure this environment variable to point to the internal NestJS API.",
    );
  }

  return url;
}
