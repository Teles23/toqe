import { z } from "zod";
import { criarClienteRapidoSchema } from "./auth";

export const tipoAgendamentoSchema = z.enum(["AGENDADO", "WALK_IN", "ENCAIXE"]);

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

  // Tipo do agendamento. Opcional — service trata `undefined` como 'AGENDADO'
  // para back-compat. WALK_IN = cliente chegou sem agendamento (fila).
  // ENCAIXE = inserção entre dois slots já ocupados.
  // (.optional() em vez de .default() para não tornar `tipo` obrigatório no tipo
  // de saída do createZodDto — quebraria fixtures de teste existentes.)
  tipo: tipoAgendamentoSchema.optional(),

  observacao: z
    .string()
    .max(500, "Observação muito longa")
    .optional()
    .or(z.literal("")),
});

// Walk-in autenticado (barbeiro/recepção) — cria cliente + agendamento de forma
// ATÔMICA no backend. Resolve o orphan-client: ou `cliente` (cria/reaproveita o
// usuário) ou `clienteId` (existente), nunca os dois. `inicio` é definido pelo
// servidor (agora), pois walk-in = cliente chegou agora.
export const createWalkInSchema = z
  .object({
    barbeiroId: z
      .number({ invalid_type_error: "Selecione um barbeiro" })
      .int()
      .positive("Barbeiro inválido"),

    servicosIds: z
      .array(z.number().int().positive())
      .min(1, "Selecione ao menos um serviço"),

    // Encaixe (walk-in) pode ser anônimo: e-mail é opcional aqui (o servidor
    // gera um único quando ausente). NÃO afeta o `criarClienteRapidoSchema`
    // base, usado por outros fluxos onde o e-mail continua obrigatório.
    cliente: criarClienteRapidoSchema.partial({ email: true }).optional(),

    clienteId: z.number().int().positive("Cliente inválido").optional(),
  })
  .refine((d) => (d.cliente == null) !== (d.clienteId == null), {
    message: "Forneça `cliente` (novo) ou `clienteId` (existente), nunca ambos",
  });

// Booking público (sem autenticação) — cliente é criado/reaproveitado pelo
// próprio fluxo. `barbeiroId` aceita 0 para "qualquer barbeiro disponível"
// (o service escolhe um automaticamente). `servicosIds` reusa as regras do
// schema autenticado.
export const createPublicAgendamentoSchema = z.object({
  barbeiroId: z
    .number({ invalid_type_error: "Selecione um barbeiro" })
    .int()
    .min(0, "Barbeiro inválido"),

  inicio: z.string().datetime({ message: "Data/hora de início inválida" }),

  servicosIds: z
    .array(z.number().int().positive())
    .min(1, "Selecione ao menos um serviço"),

  cliente: criarClienteRapidoSchema,

  observacao: z
    .string()
    .max(500, "Observação muito longa")
    .optional()
    .or(z.literal("")),
});

export const patchStatusAgendamentoSchema = z.object({
  status: z.enum(
    ["confirmado", "em_andamento", "cancelado", "concluido", "no_show"],
    {
      errorMap: () => ({ message: "Status inválido" }),
    },
  ),
});

export const listAgendamentoSchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido — use YYYY-MM-DD")
    .optional(),
  barbeiroId: z.coerce.number().int().positive().optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  status: z
    .enum([
      "pendente",
      "confirmado",
      "em_andamento",
      "cancelado",
      "concluido",
      "no_show",
    ])
    .optional(),
  tipo: tipoAgendamentoSchema.optional(),
  // Quando "true" (combinado com barbeiroId), muda o sentido de `barbeiroId`:
  // em vez de filtrar pelo barbeiro DESIGNADO, retorna os encaixes que o
  // barbeiro PODE atender (exclui serviços que ele desativou). A fila de
  // encaixe não tem barbeiro designado — qualquer um compatível atende.
  // String ("true"/"false") porque vem de query param; o service compara
  // explicitamente com "true" (sem coerce, que trataria "false" como truthy).
  barbeiroCompativel: z.enum(["true", "false"]).optional(),
});

export type TipoAgendamento = z.infer<typeof tipoAgendamentoSchema>;
export type CreateAgendamentoInput = z.infer<typeof createAgendamentoSchema>;
export type CreatePublicAgendamentoInput = z.infer<
  typeof createPublicAgendamentoSchema
>;
export type CreateWalkInInput = z.infer<typeof createWalkInSchema>;
export type PatchStatusAgendamentoInput = z.infer<
  typeof patchStatusAgendamentoSchema
>;
export type ListAgendamentoInput = z.infer<typeof listAgendamentoSchema>;

export const createAvaliacaoSchema = z.object({
  nota: z
    .number({ invalid_type_error: "Nota deve ser um número" })
    .int()
    .min(1, "Nota mínima é 1")
    .max(5, "Nota máxima é 5"),
  comentario: z.string().max(1000, "Comentário muito longo").optional(),
});

export type CreateAvaliacaoInput = z.infer<typeof createAvaliacaoSchema>;
