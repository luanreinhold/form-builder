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
  /** Cor do icone — unico sinal visual da variante. */
  accent: string;
  /** Urgencia da live region: danger/warning interrompem o leitor de tela. */
  assertive: boolean;
}

const VARIANTS: Record<ToastVariant, VariantStyle> = {
  info: { icon: "info", accent: "text-info", assertive: false },
  success: { icon: "check-circle", accent: "text-success", assertive: false },
  warning: { icon: "alert-triangle", accent: "text-warning", assertive: true },
  danger: { icon: "alert-circle", accent: "text-danger", assertive: true },
};

/**
 * Duracao (ms) da animacao de saida. Espelha o `animate-toast-out` do
 * tailwind.config — se um mudar, o outro muda junto.
 */
export const TOAST_EXIT_DURATION = 150;

/**
 * ToastItem — um card da fila. Cuida do proprio timer de auto-dismiss: pausa
 * no hover/foco e retoma do tempo restante, para que a notificacao nao suma
 * enquanto o usuario ainda esta lendo ou indo clicar no fechar.
 *
 * O fechamento e em duas etapas: `leaving` troca a animacao de entrada pela de
 * saida e so depois dela o item sai da store, senao o card desmontaria antes de
 * a animacao rodar.
 */
function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const { id, title, description, variant = "info", duration = DEFAULT_TOAST_DURATION } = toast;
  const style = VARIANTS[variant];

  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  useEffect(() => {
    // duration <= 0 = toast persistente (so fecha no clique do usuario).
    if (duration <= 0 || paused || leaving) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => setLeaving(true), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    };
  }, [duration, paused, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => dismiss(id), TOAST_EXIT_DURATION);
    return () => clearTimeout(timer);
  }, [leaving, id, dismiss]);

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
      data-state={leaving ? "leaving" : "open"}
      className={clsx(
        "pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-edge-soft bg-popover p-3.5 shadow-xl motion-reduce:animate-none",
        leaving ? "animate-toast-out" : "animate-toast-in",
      )}
    >
      <Icon
        name={style.icon}
        width={18}
        height={18}
        className={clsx("mt-0.5 shrink-0", style.accent)}
      />
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
        onClick={() => setLeaving(true)}
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
