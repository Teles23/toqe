// Tipos públicos do fluxo de booking. Modelados a partir das respostas
// dos endpoints `/publico/*` da API (sem dados sensíveis: sem email/telefone
// de barbeiro, sem stats, sem faturamento).

export interface BarbeariaPublica {
  codigo: number;
  nome: string;
  slug: string;
  ativo: boolean;
  timezone: string;
  tema: { logoUrl: string | null; corPrimaria: string | null } | null;
}

export interface ServicoPublico {
  codigo: number;
  nome: string;
  precoBase: number | string | null;
  duracaoBase: number | null;
}

export interface BarbeiroPublico {
  codigo: number;
  nome: string;
  avatarUrl: string | null;
}

export interface SlotPublico {
  horario: string; // "HH:MM"
  barbeiroId: number;
}
