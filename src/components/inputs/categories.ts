import type { IconName } from "@/components/icons/Icon";

/**
 * Fonte unica das categorias da paleta. A chave e o id estavel (usado em
 * REGISTRY e como chave de estado); `label` e o texto exibido ao usuario.
 * A ordem de declaracao define a ordem das secoes no LeftPanel.
 */
export const CATEGORIES = {
  texto: { label: "Texto", icon: "text" },
  numerico: { label: "Numérico", icon: "hash" },
  dataHora: { label: "Data/Hora", icon: "calendar" },
  documentosBr: { label: "Documentos BR", icon: "id-card" },
  avancado: { label: "Avançado", icon: "sliders" },
  upload: { label: "Upload", icon: "upload" },
  modalLookup: { label: "Modal/Lookup", icon: "app-window" },
  selecao: { label: "Seleção", icon: "list" },
} as const satisfies Record<string, { label: string; icon: IconName }>;

export type CategoryId = keyof typeof CATEGORIES;
