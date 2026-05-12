"use client";

import { useState, useEffect } from "react";
import type { Slot } from "../types/agenda.types";

export function useActiveProgress(initial: Slot[]): Slot[] {
  const [slots, setSlots] = useState(initial);

  useEffect(() => {
    setSlots(initial);
  }, [initial]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlots((prev) =>
        prev.map((s) => {
          if (s.status !== "active" || s.progressPct === undefined) return s;
          return {
            ...s,
            progressPct: Math.min(100, (s.progressPct ?? 0) + 0.5),
          };
        }),
      );
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return slots;
}
