import {
  Store,
  Clock,
  Bell,
  CreditCard,
  Shield,
  QrCode,
  Key,
} from "lucide-react";
import { DIAS_SEMANA_LONGO } from "@/shared/lib/constants";
import type {
  SecaoId,
  NotificacaoConfig,
  HorarioDia,
} from "../types/configuracao.types";

export const SECOES: { id: SecaoId; label: string; icon: typeof Store }[] = [
  { id: "barbearia", label: "Barbearia", icon: Store },
  { id: "horarios", label: "Horários", icon: Clock },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "qrcode", label: "QR Code", icon: QrCode },
  { id: "plano", label: "Plano & Fatura", icon: CreditCard },
  { id: "seguranca", label: "Segurança", icon: Shield },
  { id: "api-keys", label: "API Keys", icon: Key },
];

export const HORARIOS_DEFAULT: HorarioDia[] = DIAS_SEMANA_LONGO.map(
  (_dia, i) => ({
    diaSemana: i,
    aberto: i < 6,
    abertura: i < 5 ? "08:00" : "09:00",
    fechamento: i < 6 ? "18:00" : "16:00",
  }),
);

export const NOTIFICACOES_DEFAULT: NotificacaoConfig = {
  novoAgendamento: true,
  cancelamento: true,
  lembreteCliente: true,
  lembreteInternos: false,
  relatorioDiario: true,
  clienteNovo: true,
  avaliacaoRecebida: false,
  pagamentoRecebido: true,
};

export const GRUPOS_NOTIFICACAO: {
  titulo: string;
  items: { key: keyof NotificacaoConfig; label: string; desc: string }[];
}[] = [
  {
    titulo: "Agendamentos",
    items: [
      {
        key: "novoAgendamento",
        label: "Novo agendamento",
        desc: "Quando um cliente agenda pelo app",
      },
      {
        key: "cancelamento",
        label: "Cancelamento",
        desc: "Quando um agendamento é cancelado",
      },
      {
        key: "lembreteCliente",
        label: "Lembrete para cliente",
        desc: "30min antes do horário agendado",
      },
      {
        key: "lembreteInternos",
        label: "Lembrete interno",
        desc: "Notifica a equipe antes do expediente",
      },
    ],
  },
  {
    titulo: "Operação",
    items: [
      {
        key: "relatorioDiario",
        label: "Relatório diário",
        desc: "Resumo do dia enviado à noite",
      },
      {
        key: "clienteNovo",
        label: "Cliente novo",
        desc: "Primeiro agendamento de um cliente",
      },
      {
        key: "avaliacaoRecebida",
        label: "Avaliação recebida",
        desc: "Quando um cliente avalia o serviço",
      },
      {
        key: "pagamentoRecebido",
        label: "Pagamento confirmado",
        desc: "Confirmação de pagamento via app",
      },
    ],
  },
];
