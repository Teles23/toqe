import { BaseButton, type BaseButtonProps } from "./BaseButton";
import { useTheme } from "@/src/shared/theme";

export type DangerButtonProps = Omit<BaseButtonProps, "bg" | "fg" | "border">;

/**
 * Ação destrutiva — sem fundo, texto vermelho.
 * Usado para cancelar/remover/sair.
 */
export function DangerButton(props: DangerButtonProps) {
  const { palette } = useTheme();
  return (
    <BaseButton
      {...props}
      bg="transparent"
      fg={palette.danger}
      border={palette.dangerDim}
    />
  );
}
