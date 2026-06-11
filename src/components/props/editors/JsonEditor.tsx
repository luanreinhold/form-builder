import { useEffect, useState } from "react";

interface Props {
  label: string;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function JsonEditor({ label, value, onChange }: Props) {
  const [text, setText] = useState(() => safeStringify(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(safeStringify(value));
  }, [value]);

  function handleChange(next: string) {
    setText(next);
    if (next.trim() === "") {
      setError(null);
      onChange(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(next);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        className={`w-full rounded-lg border bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-slate-200 ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-500/40"
            : "border-slate-300 focus:border-indigo-400 focus:ring-indigo-200 dark:border-slate-700 dark:focus:ring-indigo-500/40"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}

function safeStringify(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}
