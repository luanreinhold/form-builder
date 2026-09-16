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

  // divider nao e um input: sem wrapper de label/asterisco de obrigatorio.
  if (field.type === "divider-component") {
    return renderDivider(props);
  }
  const label = (props.label as string) || (props.name as string) || entry.label;
  const required = props.required === true;
  const placeholder = (props.placeholder as string) ?? "";

  // checkbox: a caixa vem antes do texto, nao abaixo de um label proprio.
  if (field.type === "checkbox-component") {
    return renderCheckbox(props, label, required);
  }

  return (
    <div className="space-y-1">
      {/* biome-ignore lint/a11y/noLabelWithoutControl: o controle e renderizado dentro do label via renderControl() */}
      <label className="block">
        <span
          className="mb-1 flex items-baseline text-sm font-medium text-foreground"
          title={label}
        >
          <span className="truncate">{label}</span>
          {required && <span className="ml-1 shrink-0 text-danger">*</span>}
        </span>
        {renderControl(field, placeholder)}
      </label>
      {props.hint ? (
        <p className="break-words text-xs text-muted-foreground">{props.hint as string}</p>
      ) : null}
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
      return <input type="date" className={baseCls} disabled />;
    case "input-time":
      return <input type="time" className={baseCls} disabled />;
    case "input-attach":
      return <input type="file" className={baseCls} disabled />;
    case "select-multiple":
    case "select-search":
    case "dynamic-select":
      return (
        <select className={baseCls} disabled>
          <option>{placeholder || "Selecione..."}</option>
        </select>
      );
    case "radio-component":
      return renderRadio(field.props as Record<string, unknown>);
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
          <span className="shrink-0 text-sm text-muted-foreground">R$</span>
          <input className={`${baseCls} min-w-0`} placeholder={placeholder || "0,00"} disabled />
        </div>
      );
    case "input-modal":
    case "input-cep-modal":
      return (
        <div className="flex gap-2">
          <input className={`${baseCls} min-w-0`} placeholder={placeholder} disabled />
          <button
            type="button"
            className="shrink-0 rounded-lg bg-muted px-3 text-sm text-muted-foreground"
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

// O preview exibe sempre o label: transformDivider so muda a renderizacao
// na v3 (troca label por <hr>), nao a exibicao do campo no builder.
function renderDivider(props: Record<string, unknown>): JSX.Element {
  const label = (props.label as string) || "Divisória";
  const fontSize = props.fontSize as string | undefined;
  return (
    <div
      className={`truncate text-sm font-medium text-foreground ${(props.labelClass as string) || ""}`}
      style={fontSize ? { fontSize } : undefined}
      title={label}
    >
      {label}
    </div>
  );
}

function renderCheckbox(
  props: Record<string, unknown>,
  label: string,
  required: boolean,
): JSX.Element {
  return (
    <div className="space-y-1">
      <label className="flex cursor-not-allowed items-center gap-1.5 text-sm font-medium text-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0"
          checked={props.checked === true}
          readOnly
          disabled
        />
        <span className="truncate" title={label}>
          {label}
        </span>
        {required && <span className="shrink-0 text-danger">*</span>}
      </label>
      {props.hint ? (
        <p className="break-words text-xs text-muted-foreground">{props.hint as string}</p>
      ) : null}
    </div>
  );
}

type RadioOption = { label: string; value: string | number; selected?: boolean };

function radioOptions(props: Record<string, unknown>): RadioOption[] {
  const source = props.source;
  if (Array.isArray(source) && source.length > 0) return source as RadioOption[];
  return [
    { label: "Opção 1", value: 1 },
    { label: "Opção 2", value: 2 },
  ];
}

function renderRadio(props: Record<string, unknown>): JSX.Element {
  const options = radioOptions(props);
  const vertical = props.vertical === true;
  const selected = props.selected;
  return (
    <div className={`flex gap-x-4 gap-y-1 ${vertical ? "flex-col" : "flex-wrap items-center"}`}>
      {options.map((opt) => (
        <label
          key={String(opt.value)}
          className="flex cursor-not-allowed items-center gap-1.5 text-sm text-foreground"
        >
          <input
            type="radio"
            className="h-4 w-4"
            checked={
              selected !== undefined && selected !== ""
                ? String(selected) === String(opt.value)
                : opt.selected === true
            }
            readOnly
            disabled
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
