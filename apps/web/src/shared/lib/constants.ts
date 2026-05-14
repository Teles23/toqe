// ---- TanStack Query ----

export const STALE_TIME = {
  /** Dados em tempo real (agenda ativa). */
  REALTIME: 10_000,
  /** Dados de lista que mudam com pouca frequência. */
  DEFAULT: 60_000,
} as const;

export const QUERY_KEYS = {
  agendamentos: (barCodigo: number, date: string) =>
    ["agendamentos", barCodigo, date] as const,
  barbeirosAgenda: (barCodigo: number) =>
    ["barbeiros-agenda", barCodigo] as const,
  barbeiros: (barCodigo: number) => ["barbeiros", barCodigo] as const,
  clientes: (barCodigo: number) => ["clientes", barCodigo] as const,
  servicos: (barCodigo: number) => ["servicos", barCodigo] as const,
  dashboard: () => ["dashboard", "overview"] as const,
  relatorios: {
    faturamento: (barCodigo: number, periodo: string) =>
      ["relatorios", "faturamento", barCodigo, periodo] as const,
    agendamentos: (barCodigo: number, periodo: string) =>
      ["relatorios", "agendamentos", barCodigo, periodo] as const,
    servicos: (barCodigo: number, periodo: string) =>
      ["relatorios", "servicos", barCodigo, periodo] as const,
    barbeiros: (barCodigo: number, periodo: string) =>
      ["relatorios", "barbeiros", barCodigo, periodo] as const,
    horariosPico: (barCodigo: number, periodo: string) =>
      ["relatorios", "horarios-pico", barCodigo, periodo] as const,
  },
  configuracoes: {
    barbearia: (barCodigo: number) =>
      ["configuracoes", "barbearia", barCodigo] as const,
    horarios: (barCodigo: number) =>
      ["configuracoes", "horarios", barCodigo] as const,
    notificacoes: (barCodigo: number) =>
      ["configuracoes", "notificacoes", barCodigo] as const,
  },
} as const;

// ---- Dias da semana ----

/** Abreviações dos dias da semana começando em domingo (índice compatível com Date.getDay()). */
export const DIAS_SEMANA_CURTO = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

/** Nomes completos dos dias da semana começando em domingo. */
export const DIAS_SEMANA_LONGO = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
