// Barrel de schemas Zod — source of truth de validação compartilhada entre apps.
// Use import direto do submódulo (`@toqe/contracts/schemas/auth`) quando quiser
// minimizar bundle no frontend; este barrel é conveniente para o backend.

export * from "./admin";
export * from "./agenda";
export * from "./agendamento";
export * from "./auth";
export * from "./barbearia";
export * from "./convite";
export * from "./notificacao";
export * from "./servico";
export * from "./usuario";
