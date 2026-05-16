import { StyleSheet, Text, View } from "react-native";

import { getInitials, getInitialsColor } from "../utils/get-initials-color";

export interface ClienteAvatarProps {
  /** Nome do cliente — usado para iniciais e cor de fundo determinística. */
  nome: string;
  /** Diâmetro em px. Default: 44 (touch target mínimo WCAG AA). */
  size?: number;
  testID?: string;
}

/**
 * Avatar circular com iniciais do cliente sobre fundo *hash-color*.
 *
 * Princípio Urban Flow:
 * - Cor de fundo derivada do nome → cliente "Carlos" sempre azul-escuro,
 *   "Ana" sempre âmbar-escuro etc. Memorável sem foto.
 * - Cores são variações *Dim* da paleta (âmbar/verde/teal/vinho/azul muito
 *   escuros) — evita o azul corporativo genérico que os concorrentes usam.
 * - Tamanho default 44pt = touch target mínimo. Caller pode passar 80
 *   para o header do perfil.
 *
 * Texto em Sora_700Bold proporcional ao size (~40% da altura).
 */
export function ClienteAvatar({ nome, size = 44, testID }: ClienteAvatarProps) {
  const initials = getInitials(nome);
  const bg = getInitialsColor(nome);
  const fontSize = Math.round(size * 0.4);

  return (
    <View
      testID={testID ?? "cliente-avatar"}
      accessibilityRole="image"
      accessibilityLabel={`Avatar de ${nome || "cliente"}`}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize, lineHeight: Math.round(fontSize * 1.1) },
        ]}
      >
        {initials || "·"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: "Sora_700Bold",
    color: "#ffffff",
  },
});
