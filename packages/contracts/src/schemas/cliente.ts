import { z } from "zod";

/**
 * Nota privada do barbeiro sobre um cliente (slide 13). Conteúdo livre,
 * limitado para evitar abuso. Vazio = remover a nota.
 */
export const salvarNotaClienteSchema = z.object({
  conteudo: z.string().max(2000, "Nota muito longa (máx. 2000 caracteres)"),
});

export type SalvarNotaClienteInput = z.infer<typeof salvarNotaClienteSchema>;
