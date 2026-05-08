// Zod schemas — fonte de verdade de validação compartilhada
// Usado no frontend (react-hook-form) e pode ser usado no BFF (Next.js route handlers)
// A API NestJS usa class-validator internamente, mas as regras devem ser equivalentes

export * from './auth.schema';
export * from './usuario.schema';
export * from './barbearia.schema';
export * from './servico.schema';
export * from './agendamento.schema';
export * from './agenda.schema';
export * from './notificacao.schema';
