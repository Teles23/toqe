import { CanalNotificacao, StatusAgendamento } from '../types';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  senha: string;
}

export interface RegisterDto {
  nome:     string;
  email:    string;
  senha:    string;
  telefone?: string;
}

export interface RefreshTokenDto {
  refresh_token: string;
}

export interface LogoutDto {
  refresh_token: string;
}

// ─── Usuário ──────────────────────────────────────────────────────────────────

export interface UpdateUsuarioDto {
  nome?:      string;
  telefone?:  string;
  avatarUrl?: string;
}

// ─── Barbearia ────────────────────────────────────────────────────────────────

export interface CreateBarbeariaDto {
  nome: string;
  slug: string;
}

export interface UpdateBarbeariaDto {
  nome?:     string;
  telefone?: string;
  email?:    string;
  endereco?: string;
  logoUrl?:  string;
}

export interface ConvidarMembroDto {
  email:  string;
  perfil: string;
}

// ─── Serviço ──────────────────────────────────────────────────────────────────

export interface CreateServicoDto {
  nome:        string;
  descricao?:  string;
  precoBase:   number;
  duracaoBase: number;
}

export interface UpdateServicoDto extends Partial<CreateServicoDto> {
  ativo?: boolean;
}

// ─── Agenda / Jornada ─────────────────────────────────────────────────────────

export interface ConfigJornadaDto {
  diaSemana: number;   // 0–6
  inicio:    string;   // "HH:mm"
  fim:       string;
  almocoIni: string;
  almocoFim: string;
}

export interface CreateBloqueioDto {
  inicio:      string;   // ISO 8601
  fim:         string;
  motivo?:     string;
  recorrente?: boolean;
}

// ─── Agendamento ──────────────────────────────────────────────────────────────

export interface CreateAgendamentoDto {
  barbeiroId:  number;
  clienteId:   number;
  inicio:      string;   // ISO 8601
  servicosIds: number[];
}

export interface ListAgendamentoDto {
  data?:       string;
  barbeiroId?: number;
  status?:     StatusAgendamento;
}

export interface PatchStatusAgendamentoDto {
  status: StatusAgendamento;
}

// ─── Notificação ──────────────────────────────────────────────────────────────

export interface UpdatePreferenciasDto {
  canal: CanalNotificacao;
  ativo: boolean;
}
