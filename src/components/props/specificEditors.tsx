import type { ReactNode } from "react";
import type { FieldType } from "@/types";
import { formatPropName } from "@/utils/formatErrors";
import { BooleanEditor } from "./editors/BooleanEditor";
import { FieldsEditor } from "./editors/FieldsEditor";
import { FiltersEditor, isPrimitiveRecord } from "./editors/FiltersEditor";
import { JsonEditor } from "./editors/JsonEditor";
import { RedirectFieldsEditor } from "./editors/RedirectFieldsEditor";
import { SourceEditor } from "./editors/SourceEditor";
import { StringEditor } from "./editors/StringEditor";

export type SpecificKind = "string" | "number" | "boolean" | "json";

export type Specific = { key: string; kind: SpecificKind };

export type EditorContext = {
  key: string;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Id do campo em edicao — usado por editores que abrem o FieldPicker. */
  fieldId?: string;
  /** Tipo do campo em edicao — usado por editores cujo shape varia por tipo. */
  fieldType?: FieldType;
};

type EditorFactory = (ctx: EditorContext) => ReactNode;

/** Editors selected by the specific prop name. Takes priority over kind. */
const KEY_EDITORS: Record<string, EditorFactory> = {
  // radio-component usa itens { label, value }; selects usam { key, value }.
  source: ({ key, value, onChange, fieldType }) => (
    <SourceEditor
      label={key}
      value={value}
      onChange={onChange}
      itemShape={fieldType === "radio-component" ? "label" : "key"}
    />
  ),
  fields: ({ key, value, onChange }) => (
    <FieldsEditor label={formatPropName(key)} value={value} onChange={onChange} />
  ),
  // Filtros v3 importados com valores aninhados/null seguem no JsonEditor.
  filters: ({ key, value, onChange }) =>
    isPrimitiveRecord(value) ? (
      <FiltersEditor label={formatPropName(key)} value={value} onChange={onChange} />
    ) : (
      <JsonEditor label={formatPropName(key)} value={value} onChange={onChange} />
    ),
  redirectFields: ({ key, value, onChange, fieldId }) => (
    <RedirectFieldsEditor label={key} value={value} onChange={onChange} fieldId={fieldId} />
  ),
  entity: ({ value, onChange }) => {
    const entityValue = (value as string) ?? "";
    return (
      <StringEditor
        label={formatPropName("entity")}
        value={entityValue}
        onChange={onChange}
        required
        placeholder="Nome da entidade (ex.: submabo)"
        error={entityValue.trim() === "" ? "Entidade é obrigatória" : undefined}
      />
    );
  },
};

/** Editors selected by the value kind. Fallback when no key-specific editor exists. */
const KIND_EDITORS: Record<SpecificKind, EditorFactory> = {
  boolean: ({ key, value, onChange }) => (
    <BooleanEditor label={key} value={Boolean(value)} onChange={onChange} />
  ),
  json: ({ key, value, onChange }) => <JsonEditor label={key} value={value} onChange={onChange} />,
  number: ({ key, value, onChange }) => (
    <StringEditor
      label={key}
      value={value !== undefined ? String(value) : ""}
      onChange={(v) => {
        if (v === "") onChange(undefined);
        else if (!Number.isNaN(Number(v))) onChange(Number(v));
      }}
      type="number"
    />
  ),
  string: ({ key, value, onChange }) => (
    <StringEditor label={key} value={(value as string) ?? ""} onChange={onChange} />
  ),
};

export function renderSpecificEditor(specific: Specific, ctx: EditorContext): ReactNode {
  const render = KEY_EDITORS[specific.key] ?? KIND_EDITORS[specific.kind];
  return render(ctx);
}
