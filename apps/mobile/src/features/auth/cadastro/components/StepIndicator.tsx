import { StyleSheet, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface StepIndicatorProps {
  /** Total de steps. */
  total: number;
  /** Step ativo (1-indexed). Steps `< current` aparecem como concluídos. */
  current: number;
  testID?: string;
}

/**
 * Indicador horizontal de progresso por steps — pontos âmbar para
 * concluídos/ativos, vazios para pendentes; linhas conectoras entre eles.
 *
 *   ● ─── ● ─── ○     (step 2 ativo, step 3 pendente)
 *
 * Usado no cadastro 3 steps. Componente puro: deriva tudo de `current`/`total`,
 * sem estado próprio nem animação ainda — a animação fica no consumidor
 * porque o `current` muda por evento de usuário, não por timer.
 */
export function StepIndicator({ total, current, testID }: StepIndicatorProps) {
  const { palette, spacing } = useTheme();

  return (
    <View
      testID={testID ?? "step-indicator"}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
      accessibilityLabel={`Passo ${current} de ${total}`}
      style={[styles.row, { paddingHorizontal: spacing.lg }]}
    >
      {Array.from({ length: total }).map((_, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum <= current;
        const isLast = stepNum === total;
        return (
          <View key={stepNum} style={styles.segment}>
            <View
              testID={`step-dot-${stepNum}`}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive
                    ? palette.primary
                    : palette.surfaceOverlay,
                  borderColor: isActive
                    ? palette.primary
                    : palette.borderStrong,
                },
              ]}
            />
            {!isLast ? (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      stepNum < current
                        ? palette.primary
                        : palette.borderStrong,
                  },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  connector: {
    width: 32,
    height: 2,
    marginHorizontal: 4,
  },
});
