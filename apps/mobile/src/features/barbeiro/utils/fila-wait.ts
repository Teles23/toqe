/**
 * Helpers puros para o card da fila do barbeiro.
 *
 * O FilaCard mostra uma "barra de progresso de espera" e um tom de cor
 * baseado em quanto tempo o cliente está aguardando. Esses cálculos vivem
 * aqui para serem testáveis sem RN e reutilizáveis.
 */

export type WaitTone = "success" | "warning" | "danger";

/**
 * Mapeia minutos aguardando para a cor semântica:
 *
 *  - `< 15min`        → `success` (verde)
 *  - `15–29min`       → `warning` (âmbar)
 *  - `>= 30min`       → `danger`  (vermelho — fila estressada)
 *
 * Faixas baseadas em benchmark de salões: 15min é o limite "esperado",
 * 30min é o limite "incômodo".
 */
export function getWaitTone(minutesWaiting: number): WaitTone {
  if (minutesWaiting < 15) return "success";
  if (minutesWaiting < 30) return "warning";
  return "danger";
}

/**
 * Calcula 0..1 representando o progresso visual da espera.
 *
 * O denominador é o tempo "tolerável" (30min): aos 30min a barra está cheia.
 * Acima disso, é clipado em 1 — a cor já vira `danger` para sinalizar.
 *
 * `minutesWaiting < 0` (clock skew) → 0 (não renderiza barra vazia ao contrário).
 */
export function getWaitProgress(
  minutesWaiting: number,
  toleranceMinutes = 30,
): number {
  if (minutesWaiting <= 0) return 0;
  return Math.min(1, minutesWaiting / toleranceMinutes);
}

/**
 * Minutos decorridos entre `arrivedAt` (ISO string ou Date) e `now`.
 *
 * `now` injetável para testar. Default: `new Date()`.
 */
export function getMinutesWaiting(
  arrivedAt: string | Date,
  now: Date = new Date(),
): number {
  const arrived = arrivedAt instanceof Date ? arrivedAt : new Date(arrivedAt);
  return Math.floor((now.getTime() - arrived.getTime()) / 60_000);
}
