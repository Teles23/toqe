/**
 * URL interna da API NestJS usada pelos BFF route handlers.
 *
 * INTERNAL_API_URL é obrigatória em produção — aponta para o NestJS dentro
 * da rede privada (ex: http://api:3000/api/v1). NEXT_PUBLIC_API_URL só é
 * usada como fallback em desenvolvimento.
 */
function resolveInternalApi(): string {
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

export const INTERNAL_API = resolveInternalApi();
