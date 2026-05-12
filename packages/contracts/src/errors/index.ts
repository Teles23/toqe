// Tipos de erro compartilhados entre frontend e backend.
// O backend serializa erros HTTP no formato `ApiErrorPayload`; o frontend
// consome via `api-client` e expõe instâncias de `ApiError`.

import { z } from "zod";

/** Códigos canônicos de erro de negócio — alinhados com BackendException no NestJS. */
export const ApiErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION: "VALIDATION",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** Detalhe por campo retornado em erros de validação (ZodError → 422/400). */
export const ApiFieldErrorSchema = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
  code: z.string().optional(),
});
export type ApiFieldError = z.infer<typeof ApiFieldErrorSchema>;

/** Payload padrão de erro HTTP retornado pela API. */
export const ApiErrorPayloadSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(), // valor de ApiErrorCode ou string específica
  message: z.string(),
  details: z.array(ApiFieldErrorSchema).optional(),
  timestamp: z.string().datetime().optional(),
  path: z.string().optional(),
  requestId: z.string().optional(),
});
export type ApiErrorPayload = z.infer<typeof ApiErrorPayloadSchema>;

/** Helper para erros de validação a partir de um ZodError. */
export function zodErrorToFieldErrors(zodError: z.ZodError): ApiFieldError[] {
  return zodError.issues.map((issue) => ({
    path: issue.path.map((seg) =>
      typeof seg === "symbol" ? String(seg) : seg,
    ),
    message: issue.message,
    code: issue.code,
  }));
}
