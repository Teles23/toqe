import { z } from "zod";

/** Slug: lowercase, hífens, sem espaços — mesmo regex do NestJS */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createBarbeariaSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo"),

  slug: z
    .string()
    .min(3, "Slug deve ter ao menos 3 caracteres")
    .max(60, "Slug muito longo")
    .regex(
      slugRegex,
      "Slug inválido — use apenas letras, números e hífens (ex: minha-barbearia)",
    ),
});

export const updateBarbeariaSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo")
    .optional(),

  slug: z
    .string()
    .min(3, "Slug deve ter ao menos 3 caracteres")
    .max(60, "Slug muito longo")
    .regex(
      slugRegex,
      "Slug inválido — use apenas letras, números e hífens (ex: minha-barbearia)",
    )
    .optional(),

  telefone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,20}$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),

  email: z.string().email("E-mail inválido").optional().or(z.literal("")),

  endereco: z
    .string()
    .max(200, "Endereço muito longo")
    .optional()
    .or(z.literal("")),

  logoUrl: z.string().url("URL de logo inválida").optional().or(z.literal("")),

  // Permissões que o dono concede aos barbeiros sobre serviços
  barbeiroCriaServico: z.boolean().optional(),
  barbeiroAlteraPreco: z.boolean().optional(),
});

export const convidarMembroSchema = z.object({
  email: z.string().email("E-mail inválido"),
  perfil: z.enum(["dono", "gerente", "barbeiro", "recepcionista", "cliente"], {
    errorMap: () => ({ message: "Perfil inválido" }),
  }),
});

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um hex válido (#RRGGBB)")
  .optional();

export const updateTemaSchema = z.object({
  corPrimaria: hexColorSchema,
  corFundo: hexColorSchema,
  logoUrl: z.string().url("URL de logo inválida").optional().or(z.literal("")),
  subdominio: z
    .string()
    .regex(
      /^[a-z0-9-]{3,60}$/,
      "Subdomínio deve ter 3-60 caracteres: letras minúsculas, números e hífens",
    )
    .optional(),
});

// ─── Horário de funcionamento ─────────────────────────────────────────────────

const horarioTimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Horário deve ser no formato HH:MM");

export const horarioFuncionamentoSchema = z.object({
  // 0 = Domingo … 6 = Sábado
  diaSemana: z.number().int().min(0).max(6),
  aberto: z.boolean(),
  abertura: horarioTimeSchema,
  fechamento: horarioTimeSchema,
});

export const upsertHorariosSchema = z
  .array(horarioFuncionamentoSchema)
  .min(1, "Informe ao menos um dia")
  .max(7, "Máximo de 7 dias");

export type HorarioFuncionamentoInput = z.infer<
  typeof horarioFuncionamentoSchema
>;
export type UpsertHorariosInput = z.infer<typeof upsertHorariosSchema>;

export type CreateBarbeariaInput = z.infer<typeof createBarbeariaSchema>;
export type UpdateBarbeariaInput = z.infer<typeof updateBarbeariaSchema>;
export type ConvidarMembroInput = z.infer<typeof convidarMembroSchema>;
export type UpdateTemaInput = z.infer<typeof updateTemaSchema>;
