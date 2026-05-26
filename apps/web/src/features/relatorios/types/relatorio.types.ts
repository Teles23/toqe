import type {
  ServicoRelatorioItem,
  BarbeiroRelatorioItem,
} from "@toqe/contracts";

export type {
  Periodo,
  FaturamentoItem,
  AgendamentosItem,
  ServicoRelatorioItem,
  BarbeiroRelatorioItem,
  HorarioPicoItem,
} from "@toqe/contracts";

// Aliases locais para compatibilidade com imports existentes
export type ServicoItem = ServicoRelatorioItem;
export type BarbeiroItem = BarbeiroRelatorioItem;
