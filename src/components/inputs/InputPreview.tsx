import type { Field } from "@/schemas/inputs.schema";
import { REGISTRY } from "./registry";

interface Props {
  field: Field;
}

/**
 * InputPreview — renderiza visual simplificado de qualquer Field.
 * Preview e puramente visual; nao replica logica real do input
 * (mascara, OCR, etc). Veja README/plano para detalhes.
 */
export function InputPreview({ field }: Props) {
  const entry = REGISTRY[field.type];
  const props = field.props as Record<string, unknown>;
  const label = (props.label as string) || (props.name as string) || entry.label;
  const required = props.required === true;
  const placeholder = (props.placeholder as string) ?? "";

  return (
    <div className="space-y-1">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: o controle e renderizado dentro do label via renderControl() */}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </span>
        {renderControl(field, placeholder)}
      </label>
      {props.hint ? <p className="text-xs text-muted-foreground">{props.hint as string}</p> : null}
    </div>
  );
}

function renderControl(field: Field, placeholder: string): JSX.Element {
  const type = field.type;
  const baseCls =
    "w-full rounded-lg border border-edge-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring";

  switch (type) {
    case "input-textarea":
      return <textarea className={baseCls} rows={3} placeholder={placeholder} disabled />;
    case "input-color":
      return <input type="color" className="h-9 w-16 cursor-not-allowed" disabled />;
    case "input-date":
    case "input-date-calendar":
      return <input type="date" className={baseCls} disabled />;
    case "input-time":
      return <input type="time" className={baseCls} disabled />;
    case "input-file":
    case "input-attach":
    case "input-attach-base64":
    case "input-photography":
      return <input type="file" className={baseCls} disabled />;
    case "select-component":
    case "select-multiple":
    case "select-search":
    case "dynamic-select":
      return (
        <select className={baseCls} disabled>
          <option>{placeholder || "Selecione..."}</option>
        </select>
      );
    case "input-json":
      return (
        <textarea
          className={`${baseCls} font-mono`}
          rows={4}
          placeholder='{ "exemplo": true }'
          disabled
        />
      );
    case "input-money":
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">R$</span>
          <input className={baseCls} placeholder={placeholder || "0,00"} disabled />
        </div>
      );
    case "input-modal":
    case "input-cep-modal":
      return (
        <div className="flex gap-2">
          <input className={baseCls} placeholder={placeholder} disabled />
          <button
            type="button"
            className="rounded-lg bg-muted px-3 text-sm text-muted-foreground"
            disabled
          >
            Buscar
          </button>
        </div>
      );
    case "input-password":
      return <input type="password" className={baseCls} placeholder={placeholder} disabled />;
    case "input-email":
      return <input type="email" className={baseCls} placeholder={placeholder} disabled />;
    case "input-number":
    case "input-decimal":
      return <input type="number" className={baseCls} placeholder={placeholder} disabled />;
    default:
      return <input type="text" className={baseCls} placeholder={placeholder} disabled />;
  }
}
