import type { Field } from '@/schemas/inputs.schema';
import { REGISTRY } from './registry';

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
  const placeholder = (props.placeholder as string) ?? '';

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderControl(field, placeholder)}
      {props.hint ? (
        <p className="text-xs text-slate-500">{props.hint as string}</p>
      ) : null}
    </div>
  );
}

function renderControl(field: Field, placeholder: string): JSX.Element {
  const type = field.type;
  const baseCls = 'w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  switch (type) {
    case 'input-textarea':
      return <textarea className={baseCls} rows={3} placeholder={placeholder} disabled />;
    case 'input-color':
      return <input type="color" className="h-9 w-16 cursor-not-allowed" disabled />;
    case 'input-date':
    case 'input-date-calendar':
      return <input type="date" className={baseCls} disabled />;
    case 'input-time':
      return <input type="time" className={baseCls} disabled />;
    case 'input-file':
    case 'input-attach':
    case 'input-attach-base64':
    case 'input-photography':
      return <input type="file" className={baseCls} disabled />;
    case 'select-component':
    case 'select-multiple':
    case 'select-search':
    case 'dynamic-select':
      return (
        <select className={baseCls} disabled>
          <option>{placeholder || 'Selecione...'}</option>
        </select>
      );
    case 'input-json':
      return <textarea className={`${baseCls} font-mono`} rows={4} placeholder='{ "exemplo": true }' disabled />;
    case 'input-money':
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-600">R$</span>
          <input className={baseCls} placeholder={placeholder || '0,00'} disabled />
        </div>
      );
    case 'input-modal':
    case 'input-cep-modal':
      return (
        <div className="flex gap-2">
          <input className={baseCls} placeholder={placeholder} disabled />
          <button type="button" className="rounded bg-slate-200 px-3 text-sm" disabled>Buscar</button>
        </div>
      );
    case 'input-password':
      return <input type="password" className={baseCls} placeholder={placeholder} disabled />;
    case 'input-email':
      return <input type="email" className={baseCls} placeholder={placeholder} disabled />;
    case 'input-number':
    case 'input-decimal':
      return <input type="number" className={baseCls} placeholder={placeholder} disabled />;
    default:
      return <input type="text" className={baseCls} placeholder={placeholder} disabled />;
  }
}