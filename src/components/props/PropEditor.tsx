import type { Field } from "@/schemas/inputs.schema";
import { BooleanEditor } from "./editors/BooleanEditor";
import { JsonEditor } from "./editors/JsonEditor";
import { StringEditor } from "./editors/StringEditor";

interface Props {
  field: Field;
  onChangeProp: (key: string, value: unknown) => void;
  onChangeMeta: (meta: { class?: string; hide?: boolean; colSpan?: number }) => void;
  onDelete: () => void;
}

const BASE_STRING_PROPS = [
  "name",
  "label",
  "placeholder",
  "hint",
  "min",
  "max",
  "customRequiredWarning",
  "labelClass",
] as const;
const BASE_BOOLEAN_PROPS = [
  "required",
  "readonly",
  "showCaracterCounter",
  "highlight",
  "doNotTranslate",
  "requestFocus",
] as const;

export function PropEditor({ field, onChangeProp, onChangeMeta, onDelete }: Props) {
  const props = field.props as Record<string, unknown>;
  const specifics = listSpecificProps(field);
  const nameValue = (props.name as string) ?? "";
  const nameError = nameValue.trim() === "" ? "name e obrigatorio" : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div>
          <div className="text-xs uppercase text-slate-400">Editando</div>
          <div className="text-sm font-semibold text-slate-700">{field.type}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window === "undefined" || window.confirm("Remover este campo?")) onDelete();
          }}
          className="text-xs rounded bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100"
        >
          Excluir
        </button>
      </div>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-slate-500">Identificacao</h4>
        <StringEditor
          label="name"
          value={nameValue}
          onChange={(v) => onChangeProp("name", v)}
          required
          error={nameError}
        />
        <StringEditor
          label="label"
          value={(props.label as string) ?? ""}
          onChange={(v) => onChangeProp("label", v)}
        />
        <StringEditor
          label="placeholder"
          value={(props.placeholder as string) ?? ""}
          onChange={(v) => onChangeProp("placeholder", v)}
        />
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-slate-500">Texto/Hint</h4>
        <StringEditor
          label="hint"
          value={(props.hint as string) ?? ""}
          onChange={(v) => onChangeProp("hint", v)}
        />
        <StringEditor
          label="min"
          value={(props.min as string) ?? ""}
          onChange={(v) => onChangeProp("min", v)}
        />
        <StringEditor
          label="max"
          value={(props.max as string) ?? ""}
          onChange={(v) => onChangeProp("max", v)}
        />
        <StringEditor
          label="customRequiredWarning"
          value={(props.customRequiredWarning as string) ?? ""}
          onChange={(v) => onChangeProp("customRequiredWarning", v)}
        />
        <StringEditor
          label="labelClass"
          value={(props.labelClass as string) ?? ""}
          onChange={(v) => onChangeProp("labelClass", v)}
        />
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-slate-500">Comportamento</h4>
        {BASE_BOOLEAN_PROPS.map((key) => (
          <BooleanEditor
            key={key}
            label={key}
            value={Boolean(props[key])}
            onChange={(v) => onChangeProp(key, v)}
          />
        ))}
      </section>

      {specifics.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-slate-500">Especificas</h4>
          {specifics.map(({ key, kind }) => {
            if (kind === "boolean") {
              return (
                <BooleanEditor
                  key={key}
                  label={key}
                  value={Boolean(props[key])}
                  onChange={(v) => onChangeProp(key, v)}
                />
              );
            }
            if (kind === "json") {
              return (
                <JsonEditor
                  key={key}
                  label={key}
                  value={props[key]}
                  onChange={(v) => onChangeProp(key, v)}
                />
              );
            }
            if (kind === "number") {
              return (
                <StringEditor
                  key={key}
                  label={key}
                  value={props[key] !== undefined ? String(props[key]) : ""}
                  onChange={(v) => {
                    if (v === "") onChangeProp(key, undefined);
                    else if (!Number.isNaN(Number(v))) onChangeProp(key, Number(v));
                  }}
                  type="number"
                />
              );
            }
            return (
              <StringEditor
                key={key}
                label={key}
                value={(props[key] as string) ?? ""}
                onChange={(v) => onChangeProp(key, v)}
              />
            );
          })}
        </section>
      )}

      <section className="space-y-2">
        <h4 className="text-xs font-semibold uppercase text-slate-500">Wrapper (BaseControl)</h4>
        <label className="block">
          <span className="block text-xs font-medium text-slate-600 mb-1">colSpan (1-12)</span>
          <select
            value={field.colSpan ?? 12}
            onChange={(e) => onChangeMeta({ colSpan: Number(e.target.value) })}
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <StringEditor
          label="class"
          value={field.class ?? ""}
          onChange={(v) => onChangeMeta({ class: v })}
        />
        <BooleanEditor
          label="hide"
          value={Boolean(field.hide)}
          onChange={(v) => onChangeMeta({ hide: v })}
        />
      </section>
    </div>
  );
}

type Specific = { key: string; kind: "string" | "number" | "boolean" | "json" };

function listSpecificProps(field: Field): Specific[] {
  const base = new Set<string>([
    ...BASE_STRING_PROPS,
    ...BASE_BOOLEAN_PROPS,
    "value",
    "keyboardOptions",
  ]);
  const items: Specific[] = [];
  for (const [key, value] of Object.entries(field.props as Record<string, unknown>)) {
    if (base.has(key)) continue;
    const kind: Specific["kind"] =
      typeof value === "boolean"
        ? "boolean"
        : typeof value === "number"
          ? "number"
          : value && typeof value === "object"
            ? "json"
            : "string";
    items.push({ key, kind });
  }
  return items;
}
