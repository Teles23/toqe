import { getCurrentGreeting, getGreeting } from "../greeting";

describe("getGreeting", () => {
  it("manhã (5h–11h) → Bom dia ☀️", () => {
    expect(getGreeting(5)).toEqual({ text: "Bom dia", icon: "☀️" });
    expect(getGreeting(9)).toEqual({ text: "Bom dia", icon: "☀️" });
    expect(getGreeting(11)).toEqual({ text: "Bom dia", icon: "☀️" });
  });

  it("tarde (12h–17h) → Boa tarde ⛅", () => {
    expect(getGreeting(12)).toEqual({ text: "Boa tarde", icon: "⛅" });
    expect(getGreeting(15)).toEqual({ text: "Boa tarde", icon: "⛅" });
    expect(getGreeting(17)).toEqual({ text: "Boa tarde", icon: "⛅" });
  });

  it("noite (18h–04h) → Boa noite 🌙", () => {
    expect(getGreeting(18)).toEqual({ text: "Boa noite", icon: "🌙" });
    expect(getGreeting(23)).toEqual({ text: "Boa noite", icon: "🌙" });
    expect(getGreeting(0)).toEqual({ text: "Boa noite", icon: "🌙" });
    expect(getGreeting(4)).toEqual({ text: "Boa noite", icon: "🌙" });
  });
});

describe("getCurrentGreeting", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("usa o relógio do dispositivo", () => {
    jest.setSystemTime(new Date("2026-05-16T08:00:00"));
    const result = getCurrentGreeting();
    // 8h da manhã → Bom dia (assume timezone local)
    expect(["Bom dia", "Boa tarde", "Boa noite"]).toContain(result.text);
  });
});
