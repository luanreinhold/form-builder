import type { Field } from "@/schemas/inputs.schema";

export interface PropEditorProps {
  field: Field;
  onChangeProp: (key: string, value: unknown) => void;
  onChangeMeta: (meta: { class?: string; hide?: boolean; colSpan?: number }) => void;
  onDelete: () => void;
}

export type ChangeProp = PropEditorProps["onChangeProp"];
export type ChangeMeta = PropEditorProps["onChangeMeta"];

export const BASE_STRING_PROPS = [
  "name",
  "label",
  "placeholder",
  "hint",
  "min",
  "max",
  "customRequiredWarning",
  "labelClass",
] as const;

export const BASE_BOOLEAN_PROPS = [
  "required",
  "readonly",
  "showCaracterCounter",
  "highlight",
  "doNotTranslate",
  "requestFocus",
] as const;

/**
 * `key` e a prop real gravada no campo (vai para o JSON exportado da v3 — nao
 * pode mudar); `label` e apenas o texto exibido ao usuario no painel.
 */
export type StringFieldCfg = { key: string; label: string; required?: boolean };

export const STRING_SECTIONS: { title: string; fields: StringFieldCfg[] }[] = [
  {
    title: "Identificadores",
    fields: [
      { key: "name", label: "Identificador (name)", required: true },
      { key: "label", label: "Título (label)" },
      { key: "placeholder", label: "Placeholder" },
    ],
  },
  {
    title: "Texto/Hint",
    fields: [
      { key: "hint", label: "Dica (hint)" },
      { key: "min", label: "Quantidade mínima (min)" },
      { key: "max", label: "Quantidade máxima (max)" },
      { key: "customRequiredWarning", label: "Aviso de campo obrigatório personalizado" },
      { key: "labelClass", label: "Classe da label (labelClass)" },
    ],
  },
];

// transformDivider e texto livre como na v3: qualquer classe CSS vale
// ('medium' 2px, 'large' 4px); vazio renderiza o label.
export const DIVIDER_STRING_PROPS = [
  "name",
  "label",
  "labelClass",
  "fontSize",
  "transformDivider",
] as const;
