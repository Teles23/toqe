import { getMinutesWaiting, getWaitProgress, getWaitTone } from "../fila-wait";

describe("getWaitTone", () => {
  it("< 15min → success", () => {
    expect(getWaitTone(0)).toBe("success");
    expect(getWaitTone(14)).toBe("success");
  });
  it("15–29min → warning", () => {
    expect(getWaitTone(15)).toBe("warning");
    expect(getWaitTone(29)).toBe("warning");
  });
  it(">= 30min → danger", () => {
    expect(getWaitTone(30)).toBe("danger");
    expect(getWaitTone(60)).toBe("danger");
  });
});

describe("getWaitProgress", () => {
  it("0 e negativo retornam 0", () => {
    expect(getWaitProgress(0)).toBe(0);
    expect(getWaitProgress(-5)).toBe(0);
  });
  it("metade do tempo tolerável → 0.5", () => {
    expect(getWaitProgress(15)).toBe(0.5);
  });
  it(">= tolerância retorna 1 (clipado)", () => {
    expect(getWaitProgress(30)).toBe(1);
    expect(getWaitProgress(120)).toBe(1);
  });
  it("respeita override de tolerância", () => {
    expect(getWaitProgress(10, 20)).toBe(0.5);
  });
});

describe("getMinutesWaiting", () => {
  it("calcula minutos entre arrived e now", () => {
    const arrived = new Date("2026-05-16T13:00:00Z");
    const now = new Date("2026-05-16T13:25:00Z");
    expect(getMinutesWaiting(arrived, now)).toBe(25);
  });
  it("aceita ISO string", () => {
    const now = new Date("2026-05-16T13:25:00Z");
    expect(getMinutesWaiting("2026-05-16T13:10:00Z", now)).toBe(15);
  });
  it("future arrival retorna negativo", () => {
    const now = new Date("2026-05-16T13:00:00Z");
    const arrived = new Date("2026-05-16T13:10:00Z");
    expect(getMinutesWaiting(arrived, now)).toBe(-10);
  });
});
