import clsx from "clsx";
import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "danger-solid" | "ghost";
export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Button — instancia unica reutilizavel (DRY).
 * Usa apenas tokens semanticos (bg-primary, text-danger, ...) que trocam em
 * :root.dark, entao dark/light e respeitado automaticamente sem JS.
 * Encaminha ref e espalha todas as props nativas (onClick, disabled, aria-*,
 * alem de ref/listeners do dnd-kit). className do chamador e aditivo.
 */
const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  secondary:
    "border border-edge-input bg-card text-foreground shadow-sm hover:bg-card-hover focus-visible:ring-ring",
  danger:
    "border border-transparent text-danger hover:border-danger-edge hover:bg-danger-surface focus-visible:ring-danger",
  "danger-solid":
    "bg-danger-surface text-danger hover:bg-danger-surface-hover focus-visible:ring-danger",
  ghost: "text-muted-foreground hover:bg-card-hover hover:text-foreground focus-visible:ring-ring",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-3 py-1.5 text-sm",
  icon: "h-8 w-8 shrink-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    />
  );
});
