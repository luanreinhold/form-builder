export interface FieldsValue {
  key: string;
  value: string;
}

interface Props {
  label: string;
  value: unknown;
  onChange: (v: FieldsValue) => void;
}

const inputClass =
  "w-full rounded-lg border border-edge-input bg-card px-2.5 py-1.5 text-sm text-foreground transition-colors focus:border-primary-active focus:outline-none focus:ring-2 focus:ring-ring-soft";

function normalize(value: unknown): FieldsValue {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    return {
      key: typeof v.key === "string" ? v.key : "",
      value: typeof v.value === "string" ? v.value : "",
    };
  }
  return { key: "", value: "" };
}

/**
 * FieldsEditor — edita o mapeamento `fields` do dynamic-select:
 * `key` (atributo exibido) e `value` (atributo armazenado) vindos da entidade.
 */
export function FieldsEditor({ label, value, onChange }: Props) {
  const fields = normalize(value);

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <label className="block">
        <span className="mb-1 block text-[11px] text-faint">Identificador</span>
        <input
          aria-label="Identificador"
          value={fields.key}
          onChange={(e) => onChange({ ...fields, key: e.target.value })}
          placeholder="Atributo exibido (ex.: atrNomeSubMotivoAbono)"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] text-faint">Valor</span>
        <input
          aria-label="Valor"
          value={fields.value}
          onChange={(e) => onChange({ ...fields, value: e.target.value })}
          placeholder="Atributo armazenado (ex.: atrIdSubMotivoAbono)"
          className={inputClass}
        />
      </label>
    </div>
  );
}
