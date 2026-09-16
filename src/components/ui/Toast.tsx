import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_TOAST_DURATION,
  type Toast,
  type ToastVariant,
  useToastStore,
} from "@/store/toastStore";

interface VariantStyle {
  icon: IconName;
  /** Cor do icone + borda de acento a esquerda. */
  accent: string;
  /** Urgencia da live region: danger/warning interrompem o leitor de tela. */
  assertive: boolean;
}

const VARIANTS: Record<ToastVariant, VariantStyle> = {
  info: { icon: "info", accent: "border-l-info text-info", assertive: false },
  success: { icon: "check-circle", accent: "border-l-success text-success", assertive: false },
  warning: { icon: "alert-triangle", accent: "border-l-warning text-warning", assertive: true },
  danger: { icon: "alert-circle", accent: "border-l-danger text-danger", assertive: true },
};

/**
 * ToastItem — um card da fila. Cuida do proprio timer de auto-dismiss: pausa
 * no hover/foco e retoma do tempo restante, para que a notificacao nao suma
 * enquanto o usuario ainda esta lendo ou indo clicar no fechar.
 */
function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { id, title, description, variant = "info", duration = DEFAULT_TOAST_DURATION } = toast;
  const style = VARIANTS[variant];

  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  useEffect(() => {
    // duration <= 0 = toast persistente (so fecha no clique do usuario).
    if (duration <= 0 || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismiss(id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [duration, paused, id, dismiss]);

  return (
    // Hover/foco aqui so pausam o timer — nao sao afordancia clicavel; o unico
    // elemento interativo do toast e o botao de fechar, que ja e um <button>.
    // aria-atomic faz o leitor anunciar titulo + descricao juntos, entao a live
    // region dispensa aria-labelledby/describedby.
    // biome-ignore lint/a11y/noStaticElementInteractions: ver comentario acima
    <div
      role={style.assertive ? "alert" : "status"}
      aria-live={style.assertive ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      data-testid="toast"
      data-variant={variant}
      className={clsx(
        "pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-l-4 border-edge-soft bg-popover p-3.5 shadow-xl animate-toast-in motion-reduce:animate-none",
        style.accent,
      )}
    >
      <Icon name={style.icon} width={18} height={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
        <p
          className={clsx(
            "break-words text-sm leading-relaxed text-muted-foreground",
            title && "mt-0.5",
          )}
        >
          {description}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Fechar notificação"
        onClick={() => dismiss(id)}
        className="-mr-1 -mt-1 h-7 w-7 focus-visible:ring-offset-popover"
      >
        <Icon name="x" width={14} height={14} />
      </Button>
    </div>
  );
}

/**
 * ToastHost — instancia unica montada no root, ao lado do AlertDialogHost.
 * Renderiza a fila do `useToastStore` em um portal no body.
 *
 * Diferente do AlertDialog, e NAO modal: sem focus-trap, sem travar o scroll do
 * body e com `pointer-events-none` no container, para que a notificacao nunca
 * bloqueie um clique no canvas. z-[60] fica acima do dialog (z-50) porque um
 * erro disparado a partir do dialog precisa continuar visivel.
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return createPortal(
    <section
      aria-label="Notificações"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </section>,
    document.body,
  );
}
