import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Animated } from "react-native";

import { ToastOverlay } from "@/src/shared/ui/Toast";
import type { ToastTone } from "@/src/shared/ui/Toast";

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

const SHOW_DURATION = 2400;
const FADE_IN = 250;
const FADE_OUT = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  "use no memo";
  const [current, setCurrent] = useState<{
    message: string;
    tone: ToastTone;
  } | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setCurrent({ message, tone });
      opacity.setValue(0);

      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_OUT,
          useNativeDriver: true,
        }).start(() => setCurrent(null));
      }, SHOW_DURATION);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {current && (
        <ToastOverlay
          message={current.message}
          tone={current.tone}
          opacity={opacity}
        />
      )}
    </ToastContext.Provider>
  );
}
