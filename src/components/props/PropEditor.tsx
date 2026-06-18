import { Button } from "@/components/ui/Button";
import type { Field } from "@/schemas/inputs.schema";
import { BooleanEditor } from "./editors/BooleanEditor";
import { FieldsEditor } from "./editors/FieldsEditor";
import { JsonEditor } from "./editors/JsonEditor";
import { SourceEditor } from "./editors/SourceEditor";
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
      <div className="flex items-center justify-between border-b border-edge pb-2">
        <div>
          <div className="text-xs uppercase text-faint">Editando</div>
          <div className="text-sm font-semibold text-foreground">{field.type}</div>
        </div>
        <Button
          variant="danger-solid"
          size="sm"
          onClick={() => {
            if (typeof window === "undefined" || window.confirm("Remover este campo?")) onDelete();
          }}
        >
          Excluir
        </Button>
      </div>

      <section className="space-y-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Identificacao
        </h4>
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
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Texto/Hint
        </h4>
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
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Comportamento
        </h4>
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
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Especificas
          </h4>
          {specifics.map(({ key, kind }) => {
            if (key === "source") {
              return (
                <SourceEditor
                  key={key}
                  label={key}
                  value={props[key]}
                  onChange={(v) => onChangeProp(key, v)}
                />
              );
            }
            if (key === "fields") {
              return (
                <FieldsEditor
                  key={key}
                  label={key}
                  value={props[key]}
                  onChange={(v) => onChangeProp(key, v)}
                />
              );
            }
            if (key === "entity") {
              const entityValue = (props.entity as string) ?? "";
              return (
                <StringEditor
                  key={key}
                  label="entity"
                  value={entityValue}
                  onChange={(v) => onChangeProp("entity", v)}
                  required
                  placeholder="Nome da entidade (ex.: submabo)"
                  error={entityValue.trim() === "" ? "entity e obrigatorio" : undefined}
                />
              );
            }
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
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Wrapper (BaseControl)
        </h4>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            colSpan (1-12)
          </span>
          <select
            value={field.colSpan ?? 12}
            onChange={(e) => onChangeMeta({ colSpan: Number(e.target.value) })}
            className="w-full rounded-lg border border-edge-input bg-card px-2 py-1.5 text-sm text-foreground transition-colors focus:border-primary-active focus:outline-none focus:ring-2 focus:ring-ring-soft"
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
