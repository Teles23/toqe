import { z } from "zod";

export const aceitarConviteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres").optional(),
  senha: z.string().min(8, "Senha deve ter ao menos 8 caracteres").optional(),
});

export type AceitarConviteInput = z.infer<typeof aceitarConviteSchema>;
