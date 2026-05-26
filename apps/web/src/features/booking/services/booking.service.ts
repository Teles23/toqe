import { api } from "@/shared/api/api-client";
import type { CreatePublicAgendamentoInput } from "@toqe/contracts";
import type {
  BarbeariaPublica,
  BarbeiroPublico,
  ServicoPublico,
  SlotPublico,
} from "../types";

// Todas as chamadas usam `auth: false` — endpoints públicos sem JWT.
const PUBLIC = { auth: false } as const;

export function getBarbeariaPublica(slug: string) {
  return api.get<BarbeariaPublica>(`/publico/${slug}`, PUBLIC);
}

export function listarServicosPublicos(slug: string) {
  return api.get<ServicoPublico[]>(`/publico/${slug}/servicos`, PUBLIC);
}

export function listarBarbeirosPublicos(slug: string) {
  return api.get<BarbeiroPublico[]>(`/publico/${slug}/barbeiros`, PUBLIC);
}

export function listarSlotsPublicos(params: {
  slug: string;
  barbeiroId: number;
  data: string;
  duracao: number;
}) {
  const qs = new URLSearchParams({
    barbeiroId: String(params.barbeiroId),
    data: params.data,
    duracao: String(params.duracao),
  });
  return api.get<SlotPublico[]>(
    `/publico/${params.slug}/slots?${qs.toString()}`,
    PUBLIC,
  );
}

export interface AgendamentoPublicoResponse {
  codigo: number;
  inicio: string;
  fim: string;
  barbeiro: { codigo: number; nome: string };
  cliente: { codigo: number; nome: string; email: string };
  barbearia: { codigo: number; nome: string };
}

export function criarAgendamentoPublico(
  slug: string,
  payload: CreatePublicAgendamentoInput,
) {
  return api.post<AgendamentoPublicoResponse>(
    `/publico/${slug}/agendamentos`,
    payload,
    PUBLIC,
  );
}

export interface AvaliacaoPublicaItem {
  nota: number;
  comentario: string | null;
  criadoEm: string;
}

export interface AvaliacoesPublicasResponse {
  media: number;
  total: number;
  items: AvaliacaoPublicaItem[];
}

export function getAvaliacoesPublicas(slug: string) {
  return api.get<AvaliacoesPublicasResponse>(
    `/publico/${slug}/avaliacoes`,
    PUBLIC,
  );
}
