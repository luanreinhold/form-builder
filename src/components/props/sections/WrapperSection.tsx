import type { Field } from "@/schemas/inputs.schema";
import { BooleanEditor } from "../editors/BooleanEditor";
import { StringEditor } from "../editors/StringEditor";
import type { ChangeMeta } from "../propConfig";
import { SectionTitle } from "./SectionTitle";

export function WrapperSection({
  field,
  onChangeMeta,
}: {
  field: Field;
  onChangeMeta: ChangeMeta;
}) {
  return (
    <section className="space-y-2">
      <SectionTitle>Diretivas Base</SectionTitle>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Largura (1-12)</span>
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
  );
}
