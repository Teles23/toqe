import { z } from "zod";

export const createAgendamentoSchema = z.object({
  barbeiroId: z
    .number({ invalid_type_error: "Selecione um barbeiro" })
    .int()
    .positive("Barbeiro inválido"),

  clienteId: z
    .number({ invalid_type_error: "Selecione um cliente" })
    .int()
    .positive("Cliente inválido"),

  inicio: z.string().datetime({ message: "Data/hora de início inválida" }),

  servicosIds: z
    .array(z.number().int().positive())
    .min(1, "Selecione ao menos um serviço"),
});

export const patchStatusAgendamentoSchema = z.object({
  status: z.enum(["confirmado", "cancelado", "concluido", "no_show"], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

export const listAgendamentoSchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido — use YYYY-MM-DD")
    .optional(),
  barbeiroId: z.coerce.number().int().positive().optional(),
  status: z
    .enum(["pendente", "confirmado", "cancelado", "concluido", "no_show"])
    .optional(),
});

export type CreateAgendamentoInput = z.infer<typeof createAgendamentoSchema>;
export type PatchStatusAgendamentoInput = z.infer<
  typeof patchStatusAgendamentoSchema
>;
export type ListAgendamentoInput = z.infer<typeof listAgendamentoSchema>;
