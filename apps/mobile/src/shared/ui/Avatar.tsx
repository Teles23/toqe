import { Image, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  /** URL da imagem. Se ausente/falha, mostra fallback com iniciais. */
  uri?: string | null;
  /** Nome usado para gerar iniciais (default: "?") */
  name?: string | null;
  size?: AvatarSize;
  testID?: string;
}

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const FONT_PX: Record<AvatarSize, number> = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 32,
};

/**
 * Avatar circular com fallback nas iniciais.
 * Extrai as 2 primeiras letras do nome (ou 1 letra se for uma palavra só).
 */
export function Avatar({ uri, name, size = "md", testID }: AvatarProps) {
  const { palette } = useTheme();
  const px = SIZE_PX[size];
  const fontSize = FONT_PX[size];

  const initials = getInitials(name);

  const container = {
    width: px,
    height: px,
    borderRadius: px / 2,
    backgroundColor: palette.overlay,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  };

  if (uri) {
    return (
      <View testID={testID} style={container}>
        <Image
          source={{ uri }}
          style={{ width: px, height: px }}
          accessibilityLabel={name ?? "avatar"}
        />
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[container, { backgroundColor: palette.primary }]}
    >
      <Text
        style={{
          color: palette.primaryOn,
          fontSize,
          fontWeight: "600",
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

/**
 * Iniciais a partir do nome. Exemplos:
 *   "Carlos Silva"     → "CS"
 *   "Carlos"           → "C"
 *   "Maria Aparecida Lima" → "ML" (primeira e última)
 *   "" / null          → "?"
 */
function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}

// Export para teste
export { getInitials as __getInitials };
