import { useEffect, useRef } from "react";

/**
 * Hook utilitário para `setInterval` com cleanup automático no unmount.
 *
 * Por que não usar `setInterval` direto num `useEffect`?
 * - O callback fica preso ao closure inicial; se ele depende de state, lê valores stale.
 * - É fácil esquecer o `clearInterval` e vazar timers entre montagens.
 *
 * Este hook mantém o callback via ref (sempre o mais recente) e limpa
 * o timer **sempre** no unmount — verificável pelo teste de unmount.
 *
 * @param callback função a chamar a cada `delay` ms
 * @param delay    intervalo em ms; passe `null` para pausar
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return undefined;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
