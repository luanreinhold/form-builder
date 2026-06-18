import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
}

interface DialogState {
  open: boolean;
  options: ConfirmOptions | null;
}

interface DialogActions {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  resolve: (result: boolean) => void;
}

export type DialogStore = DialogState & DialogActions;

/**
 * Resolver da promise pendente. Fica fora do estado do zustand porque nao e
 * serializavel e nao deve disparar re-render. Se um novo confirm() abrir com
 * outro ainda pendente, o anterior e resolvido como `false` (cancelado).
 */
let pendingResolve: ((result: boolean) => void) | null = null;

export const useDialogStore = create<DialogStore>((set) => ({
  open: false,
  options: null,
  confirm: (options) => {
    pendingResolve?.(false);
    return new Promise<boolean>((resolve) => {
      pendingResolve = resolve;
      set({ open: true, options });
    });
  },
  resolve: (result) => {
    pendingResolve?.(result);
    pendingResolve = null;
    set({ open: false, options: null });
  },
}));

/** Atalho imperativo: `if (await confirm({ title })) { ... }`. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return useDialogStore.getState().confirm(options);
}
