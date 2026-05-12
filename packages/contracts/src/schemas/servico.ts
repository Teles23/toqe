import { z } from "zod";

export const createServicoSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo"),

  descricao: z
    .string()
    .max(500, "Descrição muito longa")
    .optional()
    .or(z.literal("")),

  precoBase: z
    .number({ invalid_type_error: "Preço inválido" })
    .min(0, "Preço não pode ser negativo")
    .max(9999.99, "Preço muito alto"),

  duracaoBase: z
    .number({ invalid_type_error: "Duração inválida" })
    .int("Duração deve ser em minutos inteiros")
    .min(5, "Duração mínima: 5 minutos")
    .max(480, "Duração máxima: 8 horas"),
});

export const updateServicoSchema = createServicoSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export type CreateServicoInput = z.infer<typeof createServicoSchema>;
export type UpdateServicoInput = z.infer<typeof updateServicoSchema>;
