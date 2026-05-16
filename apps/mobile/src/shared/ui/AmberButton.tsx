import { BaseButton, type BaseButtonProps } from "./BaseButton";
import { useTheme } from "@/src/shared/theme";

export type AmberButtonProps = Omit<BaseButtonProps, "bg" | "fg" | "border">;

/**
 * CTA primário — fundo âmbar (Urban Flow), texto preto.
 * Usado para a ação principal de cada tela (no máximo 1 por tela).
 */
export function AmberButton(props: AmberButtonProps) {
  const { palette } = useTheme();
  return <BaseButton {...props} bg={palette.primary} fg={palette.primaryOn} />;
}
