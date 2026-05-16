import {
  getFullActions,
  getInlineActions,
  statusToBadge,
  toQuickAction,
} from "../agendamento-actions";

describe("getInlineActions", () => {
  it("pendente → [Confirmar, Cancelar]", () => {
    const actions = getInlineActions("pendente");
    expect(actions.map((a) => a.key)).toEqual(["confirmado", "cancelado"]);
  });

  it("confirmado → [Concluir, Cancelar]", () => {
    const actions = getInlineActions("confirmado");
    expect(actions.map((a) => a.key)).toEqual(["concluido", "cancelado"]);
  });

  it("concluido, cancelado, no_show → []", () => {
    expect(getInlineActions("concluido")).toEqual([]);
    expect(getInlineActions("cancelado")).toEqual([]);
    expect(getInlineActions("no_show")).toEqual([]);
  });
});

describe("getFullActions", () => {
  it("retorna sempre as 4 ações na ordem canônica", () => {
    const actions = getFullActions();
    expect(actions.map((a) => a.key)).toEqual([
      "confirmado",
      "concluido",
      "no_show",
      "cancelado",
    ]);
  });
});

describe("statusToBadge", () => {
  it("mapeia status conhecidos preservando label", () => {
    expect(statusToBadge("pendente")).toEqual({
      badge: "pendente",
      label: "Pendente",
    });
    expect(statusToBadge("confirmado")).toEqual({
      badge: "confirmado",
      label: "Confirmado",
    });
    expect(statusToBadge("concluido")).toEqual({
      badge: "concluido",
      label: "Concluído",
    });
    expect(statusToBadge("cancelado")).toEqual({
      badge: "cancelado",
      label: "Cancelado",
    });
  });

  it("no_show vira badge `cancelado` mas mantém label 'No-show'", () => {
    expect(statusToBadge("no_show")).toEqual({
      badge: "cancelado",
      label: "No-show",
    });
  });
});

describe("toQuickAction", () => {
  it("liga o spec ao onPress fornecido", () => {
    const onPress = jest.fn();
    const spec = getFullActions()[0]; // Confirmar
    const action = toQuickAction(spec, onPress);
    expect(action.key).toBe("confirmado");
    expect(action.label).toBe("Confirmar");
    expect(action.icon).toBe("check");
    expect(action.variant).toBe("primary");
    action.onPress();
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
