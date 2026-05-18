import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/shared/theme";

export interface FormErrorBoxProps {
  /** Mensagem de erro a exibir. Se undefined/null/"", o box não renderiza. */
  error?: string | null;
  testID?: string;
}

/**
 * Box padrão de erro global de formulário.
 * Renderiza nada se `error` for falsy.
 *
 * Substitui o padrão repetido em login.tsx, cadastro.tsx, AdicionarWalkInModal.tsx.
 */
export function FormErrorBox({ error, testID }: FormErrorBoxProps) {
  const { palette } = useTheme();

  if (!error) return null;

  return (
    <View
      testID={testID ?? "form-error-box"}
      style={[
        styles.box,
        { backgroundColor: palette.dangerDim, marginBottom: 16 },
      ]}
    >
      <Text
        style={{ color: palette.danger, fontSize: 14 }}
        accessibilityRole="alert"
      >
        {error}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    padding: 12,
  },
});
