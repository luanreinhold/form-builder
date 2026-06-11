interface Props {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function BooleanEditor({ label, value, onChange }: Props) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
      />
      <span>{label}</span>
    </label>
  );
}
