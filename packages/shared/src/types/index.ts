import { Perfil } from "../enums";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: {
    codigo: number;
    nome: string;
    email: string;
  };
}

// ─── Usuário ──────────────────────────────────────────────────────────────────

export interface BarbeariaResumo {
  codigo: number;
  nome: string;
  slug: string;
  perfil: Perfil;
}

export interface UsuarioMe {
  codigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
  barbearias: BarbeariaResumo[];
}

// ─── Barbearia ────────────────────────────────────────────────────────────────

export interface BarbeariaResponse {
  codigo: number;
  nome: string;
  slug: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  logoUrl: string | null;
  timezone: string;
  plano: string;
  ativo: boolean;
  criadoEm: string;
}

export interface MembroResponse {
  usrCodigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
  perfil: Perfil;
  criadoEm: string;
}

export interface TemaResponse {
  corPrimaria: string | null;
  corSecundaria: string | null;
  logoUrl: string | null;
  subdominio: string | null;
}

// ─── Serviço ──────────────────────────────────────────────────────────────────

export interface ServicoResponse {
  codigo: number;
  nome: string;
  descricao: string | null;
  precoBase: number;
  duracaoBase: number; // minutos
  ativo: boolean;
  criadoEm: string;
}

// ─── Agenda / Jornada ─────────────────────────────────────────────────────────

export interface JornadaResponse {
  codigo: number;
  diaSemana: number; // 0 = Domingo, 6 = Sábado
  inicio: string; // "HH:mm"
  fim: string;
  almocoIni: string;
  almocoFim: string;
}

export interface BloqueioResponse {
  codigo: number;
  inicio: string; // ISO 8601
  fim: string;
  motivo: string | null;
  recorrente: boolean;
}

// ─── Agendamento ──────────────────────────────────────────────────────────────

export type StatusAgendamento =
  | "pendente"
  | "confirmado"
  | "cancelado"
  | "concluido"
  | "no_show";

export interface AgendamentoItemResponse {
  codigo: number;
  servico: Pick<
    ServicoResponse,
    "codigo" | "nome" | "precoBase" | "duracaoBase"
  >;
  preco: number;
  duracao: number;
}

export interface AgendamentoResponse {
  codigo: number;
  inicio: string; // ISO 8601 UTC
  fim: string;
  status: StatusAgendamento;
  barbeiro: Pick<MembroResponse, "usrCodigo" | "nome" | "avatarUrl">;
  cliente: Pick<MembroResponse, "usrCodigo" | "nome" | "telefone">;
  itens: AgendamentoItemResponse[];
  criadoEm: string;
}

// ─── Notificação ──────────────────────────────────────────────────────────────

export type CanalNotificacao = "email" | "push" | "whatsapp" | "sms";

export interface PreferenciaNotificacaoResponse {
  canal: CanalNotificacao;
  ativo: boolean;
}

// ─── Barbeiro (enriquecido com stats) ────────────────────────────────────────

export interface BarbeiroComStats extends MembroResponse {
  atendimentosHoje: number;
  atendimentosMes: number;
  faturamentoMes: number;
  ticketMedio: number;
  avaliacao: number | null;
  estadoAtual: "active" | "idle" | "off";
  clienteAtual: string | null;
  servicoAtual: string | null;
}

// ─── Cliente (enriquecido com histórico) ─────────────────────────────────────

export interface ClienteComHistorico extends MembroResponse {
  totalVisitas: number;
  totalGasto: number;
  ticketMedio: number;
  ultimaVisita: string | null;
  servicoFav: string | null;
  avaliacao: number | null;
  tags: string[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface FaturamentoDia {
  dia: string; // "Seg", "Ter", etc.
  valor: number;
}

export interface ServicoPopular {
  nome: string;
  quantidade: number;
  receita: number;
  pct: number;
}

export interface AtividadeRecente {
  tipo: string;
  texto: string;
  tempo: string;
  cor: string;
}

export interface DashboardOverview {
  faturamento7d: FaturamentoDia[];
  servicosPopulares: ServicoPopular[];
  barbeiros: BarbeiroComStats[];
  atividades: AtividadeRecente[];
}
