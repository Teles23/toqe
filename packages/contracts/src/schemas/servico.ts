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

// ─── Serviços do barbeiro (TQE_BARBEIRO_SERVICO) ──────────────────────────────

/** Liga/desliga um serviço para o barbeiro (não some da lista, só desativa). */
export const toggleServicoBarbeiroSchema = z.object({
  ativo: z.boolean(),
});

/** Personaliza preço/duração do barbeiro para um serviço. */
export const atualizarServicoBarbeiroSchema = z.object({
  // null = volta a usar o precoBase do serviço da barbearia
  precoProprio: z
    .number({ invalid_type_error: "Preço inválido" })
    .min(0, "Preço não pode ser negativo")
    .max(9999.99, "Preço muito alto")
    .nullable()
    .optional(),
  duracaoMin: z
    .number({ invalid_type_error: "Duração inválida" })
    .int("Duração deve ser em minutos inteiros")
    .min(5, "Duração mínima: 5 minutos")
    .max(480, "Duração máxima: 8 horas"),
});

export type CreateServicoInput = z.infer<typeof createServicoSchema>;
export type UpdateServicoInput = z.infer<typeof updateServicoSchema>;
export type ToggleServicoBarbeiroInput = z.infer<
  typeof toggleServicoBarbeiroSchema
>;
export type AtualizarServicoBarbeiroInput = z.infer<
  typeof atualizarServicoBarbeiroSchema
>;
