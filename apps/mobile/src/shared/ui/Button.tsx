/**
 * @deprecated — preserva o contrato antigo de `Button` enquanto telas legadas
 * são migradas para `AmberButton` / `GhostButton` / `DangerButton`.
 * Será removido no commit da Fase 4 (ver `docs/35-redesign-mobile-urban-flow.md`).
 */
import { AmberButton, type AmberButtonProps } from "./AmberButton";
import { DangerButton, type DangerButtonProps } from "./DangerButton";
import { GhostButton, type GhostButtonProps } from "./GhostButton";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends Omit<
  AmberButtonProps & GhostButtonProps & DangerButtonProps,
  "ref"
> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", ...rest }: ButtonProps) {
  if (variant === "danger") {
    return <DangerButton {...rest} />;
  }
  if (variant === "secondary") {
    return <GhostButton {...rest} />;
  }
  return <AmberButton {...rest} />;
}
