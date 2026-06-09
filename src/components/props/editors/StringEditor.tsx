interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function StringEditor({ label, value, onChange, type = 'text', placeholder, required, error }: Props) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded border px-2 py-1 text-sm ${error ? 'border-red-400' : 'border-slate-300'}`}
      />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}