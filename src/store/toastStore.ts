import { create } from "zustand";
import { generateId } from "@/utils/id";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  /** Titulo curto (opcional) — omitido, o toast exibe so a descricao. */
  title?: string;
  /** Conteudo do texto. Obrigatorio: um toast sem mensagem nao comunica nada. */
  description: string;
  /** Define cor, icone e urgencia da live region. */
  variant?: ToastVariant;
  /** Tempo de exibicao em ms. `0` desativa o auto-dismiss (so fecha no clique). */
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: string;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  push: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export type ToastStore = ToastState & ToastActions;

/** Duracao padrao (ms) quando o chamador nao informa `duration`. */
export const DEFAULT_TOAST_DURATION = 5000;

/**
 * Maximo de toasts simultaneos. Acima disso o mais antigo e descartado: evita
 * empilhar a tela inteira e nao deixa a live region virar um monologo.
 */
export const MAX_TOASTS = 4;

/**
 * Fila de notificacoes. Segue o padrao imperativo do `dialogStore`/`fieldPickerStore`
 * (store + atalho de modulo via `getState()`), mas sem promise pendente: toast e
 * fire-and-forget, ninguem espera resposta.
 *
 * O timer de auto-dismiss NAO mora aqui — mora no `ToastItem`, para que hover,
 * foco e desmontagem cancelem naturalmente e a store siga pura e testavel.
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (options) => {
    const id = generateId();
    set((s) => ({ toasts: [...s.toasts, { ...options, id }].slice(-MAX_TOASTS) }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Atalho imperativo: `toast({ description: "Exportado", variant: "success" })`. */
export function toast(options: ToastOptions): string {
  return useToastStore.getState().push(options);
}
