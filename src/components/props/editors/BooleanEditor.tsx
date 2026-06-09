interface Props {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function BooleanEditor({ label, value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-300"
      />
      <span>{label}</span>
    </label>
  );
}
