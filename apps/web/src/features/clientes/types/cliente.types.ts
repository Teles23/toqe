export type ClienteStatus = "ativo" | "inativo" | "novo";

export interface ClienteAPI {
  codigo: number;
  nome: string;
  email: string;
  telefone: string | null;
  avatarUrl: string | null;
  perfil: string;
  totalVisitas: number;
  totalGasto: number;
  ticketMedio: number;
  ultimaVisita: string | null;
  servicoFav: string | null;
}

export interface Cliente extends ClienteAPI {
  initial: string;
  status: ClienteStatus;
}
