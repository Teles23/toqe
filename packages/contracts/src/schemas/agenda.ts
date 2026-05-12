import { z } from "zod";

/** Valida formato "HH:mm" */
const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido — use HH:mm");

export const configJornadaSchema = z
  .object({
    diaSemana: z.number().int().min(0).max(6),

    inicio: horaSchema,
    fim: horaSchema,
    almocoIni: horaSchema,
    almocoFim: horaSchema,
  })
  .refine((d) => d.inicio < d.fim, {
    message: "Horário de início deve ser antes do fim",
    path: ["fim"],
  })
  .refine((d) => d.almocoIni < d.almocoFim, {
    message: "Início do almoço deve ser antes do fim",
    path: ["almocoFim"],
  })
  .refine((d) => d.almocoIni >= d.inicio && d.almocoFim <= d.fim, {
    message: "Intervalo de almoço deve estar dentro do horário de trabalho",
    path: ["almocoIni"],
  });

export const createBloqueioSchema = z
  .object({
    inicio: z.string().datetime({ message: "Data/hora de início inválida" }),
    fim: z.string().datetime({ message: "Data/hora de fim inválida" }),
    motivo: z
      .string()
      .max(200, "Motivo muito longo")
      .optional()
      .or(z.literal("")),
    recorrente: z.boolean().optional(),
  })
  .refine((d) => d.inicio < d.fim, {
    message: "O início deve ser anterior ao fim",
    path: ["fim"],
  });

export type ConfigJornadaInput = z.infer<typeof configJornadaSchema>;
export type CreateBloqueioInput = z.infer<typeof createBloqueioSchema>;
