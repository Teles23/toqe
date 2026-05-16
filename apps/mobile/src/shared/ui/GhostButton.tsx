import { BaseButton, type BaseButtonProps } from "./BaseButton";
import { useTheme } from "@/src/shared/theme";

export type GhostButtonProps = Omit<BaseButtonProps, "bg" | "fg" | "border">;

/**
 * Ação secundária — sem fundo, borda forte, texto na cor primária.
 * Usado para alternativas ao CTA principal (ex.: "Continuar com Google").
 */
export function GhostButton(props: GhostButtonProps) {
  const { palette } = useTheme();
  return (
    <BaseButton
      {...props}
      bg="transparent"
      fg={palette.text}
      border={palette.borderStrong}
    />
  );
}
