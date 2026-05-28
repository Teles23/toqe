import { StyleSheet, Text, View } from "react-native";

export interface StatusPillProps {
  /** Texto do pill (renderizado em uppercase). */
  label: string;
  /** Cor base — usada no ponto, no texto e na tinta de fundo. */
  color: string;
  /** Mostra o ponto pulsante/estático à esquerda (default true). */
  dot?: boolean;
  testID?: string;
}

/**
 * Pill de status de agendamento — ponto colorido + label uppercase sobre fundo
 * tingido. Fonte única compartilhada entre a lista de agenda, o detalhe e a
 * agenda do barbeiro (DRY).
 */
export function StatusPill({
  label,
  color,
  dot = true,
  testID,
}: StatusPillProps) {
  return (
    <View
      testID={testID}
      style={[styles.pill, { backgroundColor: color + "1a" }]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.label, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
