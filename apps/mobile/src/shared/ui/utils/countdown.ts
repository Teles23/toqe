/**
 * Pure helpers para o CountdownTimer.
 *
 * Mantidos fora do componente para que sejam testáveis sem RN/renderer
 * (Jest puro, super rápido) e reutilizáveis em outros pontos do app
 * (ex.: cor de borda do card de agendamento próximo).
 */

export type CountdownTone = "success" | "warning" | "danger" | "muted";

/**
 * Mapeia minutos restantes até um agendamento para a cor semântica:
 *  - `muted`   → passou ou no momento (`< 0` minutos)
 *  - `danger`  → `[0, 15)`  — pulsante: chegou a hora
 *  - `warning` → `[15, 60)` — atenção: menos de 1h
 *  - `success` → `>= 60`    — calma: mais de 1h
 *
 * Negativo trata como passado para evitar "saltar" para success quando o
 * relógio do dispositivo está dessincronizado em segundos.
 */
export function getCountdownColor(minutesLeft: number): CountdownTone {
  if (minutesLeft < 0) return "muted";
  if (minutesLeft < 15) return "danger";
  if (minutesLeft < 60) return "warning";
  return "success";
}

/**
 * Formata um delta em ms para uma label curta em PT-BR.
 *
 * Regras:
 *  - `<= 0`    → "Agora!"
 *  - `< 60min` → "Em 30min"
 *  - `< 24h`   → "2h 15min" (omite "0min" se múltiplo exato de hora)
 *  - `>= 24h`  → "Em 2 dias" (arredondado para baixo)
 */
export function formatCountdownLabel(deltaMs: number): string {
  if (deltaMs <= 0) return "Agora!";

  const totalMinutes = Math.floor(deltaMs / 60_000);

  if (totalMinutes < 60) {
    return `Em ${totalMinutes}min`;
  }

  const totalHours = Math.floor(totalMinutes / 60);

  if (totalHours < 24) {
    const remainingMin = totalMinutes - totalHours * 60;
    return remainingMin === 0
      ? `${totalHours}h`
      : `${totalHours}h ${remainingMin}min`;
  }

  const totalDays = Math.floor(totalHours / 24);
  return totalDays === 1 ? "Em 1 dia" : `Em ${totalDays} dias`;
}
