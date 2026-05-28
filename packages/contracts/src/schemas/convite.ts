import { z } from "zod";

export const aceitarConviteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres").optional(),
  senha: z.string().min(8, "Senha deve ter ao menos 8 caracteres").optional(),
});

export type AceitarConviteInput = z.infer<typeof aceitarConviteSchema>;

/**
 * Perfis que podem ser atribuídos a um convite por e-mail.
 * Default `barbeiro` — o caso de uso principal é o dono convidar um barbeiro.
 */
export const conviteEmailPerfilSchema = z
  .enum(["gerente", "barbeiro", "recepcionista"], {
    errorMap: () => ({ message: "Perfil inválido para convite" }),
  })
  .default("barbeiro");

/**
 * Body de `POST /barbearias/:barCodigo/convite` — gera um convite por e-mail.
 * Diferente de `POST /barbearias/:barCodigo/membros` (que exige usuário já
 * registrado), este fluxo dispara um e-mail com link de aceite e funciona
 * tanto para usuários novos quanto existentes.
 */
export const gerarConviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  perfil: conviteEmailPerfilSchema,
});

export type GerarConviteInput = z.infer<typeof gerarConviteSchema>;

/** Resposta de `POST /barbearias/:barCodigo/convite` — sem dados sensíveis. */
export interface GerarConviteResponse {
  codigo: number;
  email: string;
  perfil: string;
  /** ISO string */
  expiresAt: string;
  /** `true` se um convite ativo foi reaproveitado/renovado em vez de criado. */
  reaproveitado: boolean;
}
