interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function StringEditor({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  error,
}: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-red-500 dark:text-red-400">*</span>}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm text-slate-700 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-200 ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-500/40"
            : "border-slate-300 focus:border-indigo-400 focus:ring-indigo-200 dark:border-slate-700 dark:focus:ring-indigo-500/40"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}
