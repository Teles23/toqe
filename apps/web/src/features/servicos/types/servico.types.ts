export type Categoria = "corte" | "barba" | "combo" | "estetica" | "tratamento";

export interface ServicoAPI {
  codigo: number;
  barCodigo: number;
  nome: string;
  precoBase: number | null;
  duracaoBase: number | null;
  ativo: boolean;
}

export interface Servico {
  id: number;
  nome: string;
  categoria: Categoria;
  duracao: number;
  preco: number;
  descricao: string;
  ativo: boolean;
}
