import { create } from "zustand";

export interface FieldPickerOptions {
  title?: string;
  /** Campo em edicao — excluido da lista para evitar auto-referencia. */
  excludeFieldId?: string;
  /** Names ja usados (ex.: chaves existentes do redirectFields) — exibidos desabilitados. */
  disabledNames?: string[];
}

interface FieldPickerState {
  open: boolean;
  options: FieldPickerOptions | null;
}

interface FieldPickerActions {
  pick: (options?: FieldPickerOptions) => Promise<string | null>;
  resolve: (name: string | null) => void;
}

export type FieldPickerStore = FieldPickerState & FieldPickerActions;

/**
 * Resolver da promise pendente. Fica fora do estado do zustand porque nao e
 * serializavel e nao deve disparar re-render. Se um novo pick() abrir com
 * outro ainda pendente, o anterior e resolvido como `null` (cancelado).
 * Mesmo padrao do dialogStore.
 */
let pendingResolve: ((name: string | null) => void) | null = null;

export const useFieldPickerStore = create<FieldPickerStore>((set) => ({
  open: false,
  options: null,
  pick: (options = {}) => {
    pendingResolve?.(null);
    return new Promise<string | null>((resolve) => {
      pendingResolve = resolve;
      set({ open: true, options });
    });
  },
  resolve: (name) => {
    pendingResolve?.(name);
    pendingResolve = null;
    set({ open: false, options: null });
  },
}));

/** Atalho imperativo: `const name = await pickField({ title });`. */
export function pickField(options?: FieldPickerOptions): Promise<string | null> {
  return useFieldPickerStore.getState().pick(options);
}
