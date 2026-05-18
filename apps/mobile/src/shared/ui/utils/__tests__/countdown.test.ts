import { formatCountdownLabel, getCountdownColor } from "../countdown";

describe("getCountdownColor", () => {
  it("retorna 'muted' quando o tempo passou (negativo)", () => {
    expect(getCountdownColor(-1)).toBe("muted");
    expect(getCountdownColor(-9999)).toBe("muted");
  });

  it("retorna 'danger' quando faltam menos de 15min", () => {
    expect(getCountdownColor(0)).toBe("danger");
    expect(getCountdownColor(14)).toBe("danger");
  });

  it("retorna 'warning' quando faltam de 15 a 59min", () => {
    expect(getCountdownColor(15)).toBe("warning");
    expect(getCountdownColor(45)).toBe("warning");
    expect(getCountdownColor(59)).toBe("warning");
  });

  it("retorna 'success' quando faltam 60min ou mais", () => {
    expect(getCountdownColor(60)).toBe("success");
    expect(getCountdownColor(180)).toBe("success");
  });
});

describe("formatCountdownLabel", () => {
  it("retorna 'Agora!' quando delta <= 0", () => {
    expect(formatCountdownLabel(0)).toBe("Agora!");
    expect(formatCountdownLabel(-1000)).toBe("Agora!");
  });

  it("formata minutos quando < 1h", () => {
    expect(formatCountdownLabel(30 * 60_000)).toBe("Em 30min");
    expect(formatCountdownLabel(59 * 60_000)).toBe("Em 59min");
  });

  it("formata horas + minutos quando entre 1h e 24h", () => {
    expect(formatCountdownLabel(60 * 60_000)).toBe("1h");
    expect(formatCountdownLabel(135 * 60_000)).toBe("2h 15min");
    expect(formatCountdownLabel(23 * 60 * 60_000 + 30 * 60_000)).toBe(
      "23h 30min",
    );
  });

  it("formata dias quando >= 24h", () => {
    expect(formatCountdownLabel(24 * 60 * 60_000)).toBe("Em 1 dia");
    expect(formatCountdownLabel(3 * 24 * 60 * 60_000)).toBe("Em 3 dias");
  });
});
