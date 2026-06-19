import { Fragment } from "react";
import { Button } from "@/components/ui/Button";
import type { Field } from "@/schemas/inputs.schema";
import { confirm } from "@/store/dialogStore";
import { BooleanEditor } from "./editors/BooleanEditor";
import { StringEditor } from "./editors/StringEditor";
import { renderSpecificEditor, type Specific } from "./specificEditors";

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

type StringFieldCfg = { key: string; required?: boolean };

const STRING_SECTIONS: { title: string; fields: StringFieldCfg[] }[] = [
  {
    title: "Identificacao",
    fields: [{ key: "name", required: true }, { key: "label" }, { key: "placeholder" }],
  },
  {
    title: "Texto/Hint",
    fields: [
      { key: "hint" },
      { key: "min" },
      { key: "max" },
      { key: "customRequiredWarning" },
      { key: "labelClass" },
    ],
  },
];

export function PropEditor({ field, onChangeProp, onChangeMeta, onDelete }: Props) {
  const props = field.props as Record<string, unknown>;
  const specifics = listSpecificProps(field);

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
          onClick={async () => {
            const ok = await confirm({
              title: "Remover este campo?",
              description: "Esta ação não pode ser desfeita.",
              confirmLabel: "Excluir",
              variant: "danger",
            });
            if (ok) onDelete();
          }}
        >
          Excluir
        </Button>
      </div>

      {STRING_SECTIONS.map((section) => (
        <section key={section.title} className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </h4>
          {section.fields.map(({ key, required }) => {
            const value = (props[key] as string) ?? "";
            return (
              <StringEditor
                key={key}
                label={key}
                value={value}
                onChange={(v) => onChangeProp(key, v)}
                required={required}
                error={required && value.trim() === "" ? `${key} e obrigatorio` : undefined}
              />
            );
          })}
        </section>
      ))}

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
          {specifics.map((specific) => (
            <Fragment key={specific.key}>
              {renderSpecificEditor(specific, {
                key: specific.key,
                value: props[specific.key],
                onChange: (v) => onChangeProp(specific.key, v),
              })}
            </Fragment>
          ))}
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
