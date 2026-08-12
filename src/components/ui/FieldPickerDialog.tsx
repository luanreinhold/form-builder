import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useFieldPickerStore } from "@/store/fieldPickerStore";
import { useFormStore } from "@/store/formStore";

/**
 * FieldPickerHost — instancia unica montada no root, ao lado do AlertDialogHost.
 * Renderiza o modal de selecao de campo do formulario controlado por
 * `useFieldPickerStore`: lista todos os campos do formStore (name, label, tipo)
 * para o usuario escolher qual campo recebera o valor redirecionado.
 *
 * Acessibilidade (mesmo padrao do AlertDialogHost): role="dialog", aria-modal,
 * titulo linkado, foco inicial na busca, focus-trap no Tab, Esc cancela,
 * foco restaurado ao fechar e scroll do body travado enquanto aberto.
 */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function FieldPickerHost() {
  const open = useFieldPickerStore((s) => s.open);
  const options = useFieldPickerStore((s) => s.options);
  const resolve = useFieldPickerStore((s) => s.resolve);
  const fields = useFormStore((s) => s.fields);

  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    previousFocus.current = document.activeElement as HTMLElement | null;
    searchRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open || !options) return null;

  const { title = "Selecionar campo do formulário", excludeFieldId, disabledNames = [] } = options;

  const candidates = fields.filter((f) => f.id !== excludeFieldId);
  const term = query.trim().toLowerCase();
  const visible = term
    ? candidates.filter((f) => {
        const props = f.props as { name?: string; label?: string };
        return (
          (props.name ?? "").toLowerCase().includes(term) ||
          (props.label ?? "").toLowerCase().includes(term) ||
          f.type.toLowerCase().includes(term)
        );
      })
    : candidates;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      resolve(null);
      return;
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="flex max-h-[70vh] w-full max-w-md flex-col rounded-xl border border-edge-soft bg-popover p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        <input
          ref={searchRef}
          aria-label="Buscar campo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por name, label ou tipo..."
          className="mt-3 w-full rounded-lg border border-edge-input bg-card px-2.5 py-1.5 text-sm text-foreground transition-colors focus:border-primary-active focus:outline-none focus:ring-2 focus:ring-ring-soft"
        />
        <ul className="mt-3 flex-1 space-y-1 overflow-y-auto" aria-label="Campos do formulário">
          {visible.length === 0 && (
            <li className="rounded-lg border border-dashed border-edge-input px-3 py-6 text-center text-sm text-faint">
              {candidates.length === 0
                ? "Nenhum outro campo no formulário."
                : "Nenhum campo corresponde à busca."}
            </li>
          )}
          {visible.map((f) => {
            const props = f.props as { name?: string; label?: string };
            const name = props.name ?? "";
            const disabled = disabledNames.includes(name);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => resolve(name)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:border-edge-input hover:bg-muted focus-visible:border-primary-active focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {props.label || "(sem label)"}
                      {disabled && " — já utilizado"}
                    </span>
                  </span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-faint">
                    {f.type}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="-mx-5 mt-4 border-t border-edge-soft" />
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => resolve(null)} className="min-w-[120px]">
            Cancelar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
