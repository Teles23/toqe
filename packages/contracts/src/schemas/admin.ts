import { z } from "zod";

// ── Admin: schemas de escrita ────────────────────────────────────────────────

export const updatePlanoSchema = z.object({
  plano: z.enum(["free", "basic", "pro"], {
    errorMap: () => ({ message: "Plano deve ser free, basic ou pro" }),
  }),
});

export const updateStatusAdminSchema = z.object({
  status: z.enum(["ativo", "inativo", "suspenso"], {
    errorMap: () => ({
      message: "Status deve ser ativo, inativo ou suspenso",
    }),
  }),
});

// ── Admin: schemas de leitura (response shapes) ──────────────────────────────

export const adminBarbeariaSchema = z.object({
  codigo: z.number(),
  nome: z.string(),
  slug: z.string(),
  cidade: z.string().nullable(),
  plano: z.string(),
  planoStatus: z.string(),
  ativo: z.boolean(),
  criadoEm: z.string(),
  totalBarbeiros: z.number(),
  totalAgdMes: z.number(),
  mrr: z.number(),
  ultimaAtividade: z.string().nullable(),
});

export const adminMetricsSchema = z.object({
  mrr: z.number(),
  arr: z.number(),
  totalTenants: z.number(),
  activeTenants: z.number(),
  totalBarbeiros: z.number(),
  totalAgdMes: z.number(),
});

export const adminRevenueMonthSchema = z.object({
  mes: z.string(),
  mrr: z.number(),
});

export const adminRevenueSchema = z.object({
  historico: z.array(adminRevenueMonthSchema),
  breakdown: z.array(
    z.object({
      plano: z.string(),
      count: z.number(),
      preco: z.number(),
      total: z.number(),
    }),
  ),
  churnMes: z.number(),
});

export const adminActivityItemSchema = z.object({
  tipo: z.enum(["signup", "upgrade", "churn", "payment", "alert"]),
  texto: z.string(),
  tempo: z.string(),
  barbeariaSlug: z.string().nullable(),
});

export type UpdatePlanoDto = z.infer<typeof updatePlanoSchema>;
export type UpdateStatusAdminDto = z.infer<typeof updateStatusAdminSchema>;
export type AdminBarbearia = z.infer<typeof adminBarbeariaSchema>;
export type AdminMetrics = z.infer<typeof adminMetricsSchema>;
export type AdminRevenue = z.infer<typeof adminRevenueSchema>;
export type AdminActivityItem = z.infer<typeof adminActivityItemSchema>;
