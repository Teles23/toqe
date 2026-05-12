"use client";

import { useState, useEffect } from "react";

export function useCountdown(startedAt?: string, duration?: number): string {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!startedAt || !duration) return;

    const tick = () => {
      const [h, m] = startedAt.split(":").map(Number) as [number, number];
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + duration * 60_000);
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("00:00");
        return;
      }
      const mm = Math.floor(diff / 60_000);
      const ss = Math.floor((diff % 60_000) / 1000);
      setRemaining(
        `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
      );
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, duration]);

  return remaining;
}
