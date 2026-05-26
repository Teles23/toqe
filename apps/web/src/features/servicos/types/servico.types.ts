export type { ServicoAPI } from "@toqe/contracts";

export type Categoria = "corte" | "barba" | "combo" | "estetica" | "tratamento";

export interface Servico {
  id: number;
  nome: string;
  categoria: Categoria;
  duracao: number;
  preco: number;
  descricao: string;
  ativo: boolean;
}
