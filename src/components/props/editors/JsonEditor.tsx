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
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        className={`w-full font-mono text-xs rounded border px-2 py-1 ${error ? "border-red-400" : "border-slate-300"}`}
      />
      {error && <span className="text-xs text-red-600 mt-1 block">{error}</span>}
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
