export interface AgendamentoDemo {
  clienteEmail: string;
  barbeiroEmail: string;
  inicio: Date;
  status: string;
}

export function buildAgendamentosDemo(refDate?: Date): AgendamentoDemo[];
