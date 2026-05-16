/**
 * Mapeamentos puros para o card de agendamento do barbeiro.
 *
 * Mantidos fora do componente JSX para testabilidade e DRY entre `agenda`
 * e qualquer outra tela que mostre o mesmo card (ex.: detalhe futuramente).
 */
import type { Feather } from "@expo/vector-icons";
import type {
  QuickAction,
  QuickActionVariant,
  StatusBadgeStatus,
} from "@/src/shared/ui";
import type { StatusAgendamento } from "@toqe/shared";

export type AgendamentoActionStatus = Exclude<StatusAgendamento, "pendente">;

export interface AgendamentoActionSpec {
  key: AgendamentoActionStatus;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  variant: QuickActionVariant;
}

const FULL_ACTIONS: AgendamentoActionSpec[] = [
  { key: "confirmado", label: "Confirmar", icon: "check", variant: "primary" },
  {
    key: "concluido",
    label: "Concluir",
    icon: "check-circle",
    variant: "success",
  },
  { key: "no_show", label: "No-show", icon: "user-x", variant: "neutral" },
  { key: "cancelado", label: "Cancelar", icon: "x", variant: "danger" },
];

/**
 * Mapeia o status atual do agendamento para o subconjunto de "próximas
 * ações naturais" exibidas inline na QuickActionBar.
 *
 *  - pendente   → [Confirmar, Cancelar]      (precisa decidir)
 *  - confirmado → [Concluir, Cancelar]       (vai atender ou nao)
 *  - concluido  → []                         (terminou)
 *  - cancelado  → []                         (encerrado)
 *  - no_show    → []                         (encerrado)
 *
 * O BottomSheet de long-press sempre mostra todas as 4 ações (FULL_ACTIONS).
 */
export function getInlineActions(
  status: StatusAgendamento,
): AgendamentoActionSpec[] {
  switch (status) {
    case "pendente":
      return [FULL_ACTIONS[0], FULL_ACTIONS[3]]; // Confirmar, Cancelar
    case "confirmado":
      return [FULL_ACTIONS[1], FULL_ACTIONS[3]]; // Concluir, Cancelar
    default:
      return [];
  }
}

/** Todas as ações disponíveis (para BottomSheet de long-press). */
export function getFullActions(): readonly AgendamentoActionSpec[] {
  return FULL_ACTIONS;
}

/**
 * Mapeia `StatusAgendamento` (5 valores) para `StatusBadgeStatus` (4 valores)
 * + label customizado quando necessário.
 *
 * `no_show` → visualmente `cancelado` (mesmo tom de gravidade), mas label
 *   "No-show" preserva semântica para o operador.
 */
export function statusToBadge(status: StatusAgendamento): {
  badge: StatusBadgeStatus;
  label: string;
} {
  switch (status) {
    case "pendente":
      return { badge: "pendente", label: "Pendente" };
    case "confirmado":
      return { badge: "confirmado", label: "Confirmado" };
    case "concluido":
      return { badge: "concluido", label: "Concluído" };
    case "cancelado":
      return { badge: "cancelado", label: "Cancelado" };
    case "no_show":
      return { badge: "cancelado", label: "No-show" };
  }
}

/**
 * Converte uma `AgendamentoActionSpec` em uma `QuickAction` pronta para o
 * QuickActionBar, ligando o `onPress` ao callback do parent.
 */
export function toQuickAction(
  spec: AgendamentoActionSpec,
  onPress: () => void,
): QuickAction {
  return {
    key: spec.key,
    icon: spec.icon,
    label: spec.label,
    variant: spec.variant,
    onPress,
  };
}
