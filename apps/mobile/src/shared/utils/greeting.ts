/**
 * Helper puro para greetings dinâmicos baseado na hora local.
 *
 * Mantido em `src/shared/utils` para reuso (home cliente, home barbeiro,
 * notificações, etc.) e para teste unitário sem RN.
 */

export type Greeting = {
  text: "Bom dia" | "Boa tarde" | "Boa noite";
  icon: "☀️" | "⛅" | "🌙";
};

/**
 * Mapeia hora do dia (0-23) para greeting PT-BR.
 *
 *  - 05–11 → "Bom dia"  ☀️
 *  - 12–17 → "Boa tarde" ⛅
 *  - 18–04 → "Boa noite" 🌙
 */
export function getGreeting(hour: number): Greeting {
  if (hour >= 5 && hour < 12) return { text: "Bom dia", icon: "☀️" };
  if (hour >= 12 && hour < 18) return { text: "Boa tarde", icon: "⛅" };
  return { text: "Boa noite", icon: "🌙" };
}

/** Conveniência: usa o relógio do dispositivo. */
export function getCurrentGreeting(): Greeting {
  return getGreeting(new Date().getHours());
}
