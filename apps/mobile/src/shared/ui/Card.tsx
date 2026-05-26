import {
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";

import { useTheme } from "@/src/shared/theme";

interface BaseCardProps {
  children: React.ReactNode;
  testID?: string;
}

interface StaticCardProps extends BaseCardProps, Pick<ViewProps, "style"> {
  onPress?: undefined;
  onLongPress?: undefined;
}

interface PressableCardProps
  extends
    BaseCardProps,
    Pick<
      PressableProps,
      | "onPress"
      | "onLongPress"
      | "delayLongPress"
      | "accessibilityLabel"
      | "accessibilityHint"
      | "accessibilityRole"
    > {
  style?: ViewProps["style"];
}

export type CardProps = StaticCardProps | PressableCardProps;

/**
 * Container padronizado — fundo, borda e raio consistentes via tokens.
 * Comporta-se como View ou Pressable dependendo dos handlers passados.
 */
export function Card(props: CardProps) {
  const { palette, radius, spacing } = useTheme();

  const containerStyle = [
    {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md - 2,
      marginBottom: spacing.sm + 2,
    },
  ];

  if ("onPress" in props && (props.onPress || props.onLongPress)) {
    const {
      children,
      testID,
      onPress,
      onLongPress,
      delayLongPress,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole = "button",
      style: extraStyle,
    } = props;
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        style={({ pressed }) => [
          ...containerStyle,
          extraStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={props.testID} style={[...containerStyle, props.style]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
});
