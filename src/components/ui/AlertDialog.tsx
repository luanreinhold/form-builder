import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useDialogStore } from "@/store/dialogStore";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * AlertDialogHost — instancia unica montada no root. Renderiza o dialog de
 * confirmacao imperativo controlado por `useDialogStore`. Usa apenas tokens
 * semanticos, entao dark/light e respeitado automaticamente.
 *
 * Acessibilidade: role="alertdialog", aria-modal, titulo/descricao linkados;
 * foco inicial no Cancelar (seguro para acoes destrutivas), focus-trap no Tab,
 * Esc cancela, Enter confirma, foco restaurado ao fechar e scroll do body
 * travado enquanto aberto.
 */
export function AlertDialogHost() {
  const open = useDialogStore((s) => s.open);
  const options = useDialogStore((s) => s.options);
  const resolve = useDialogStore((s) => s.resolve);

  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open || !options) return null;

  const {
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "primary",
  } = options;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      resolve(false);
      return;
    }
    // Enter/Espaco nao sao tratados aqui de proposito: acionam nativamente o
    // botao em foco (Cancelar ou Confirmar), respeitando a navegacao por Tab.
    if (e.key !== "Tab") return;
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    // Backdrop nao dispensa por clique de proposito: um alertdialog exige uma
    // escolha explicita (Cancelar/Confirmar ou Esc), evitando dispensa acidental.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onKeyDown={handleKeyDown}
        className="w-full max-w-sm rounded-xl border border-edge-soft bg-popover p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        <div className="-mx-5 mt-5 border-t border-edge-soft" />
        <div className="mt-4 flex justify-center gap-3">
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={() => resolve(false)}
            className="min-w-[120px]"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger-solid" : "primary"}
            onClick={() => resolve(true)}
            className="min-w-[120px] focus-visible:ring-offset-popover"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
