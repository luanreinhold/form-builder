import { useEffect, useId, useState } from "react";

interface Props {
  label: string;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function JsonEditor({ label, value, onChange }: Props) {
  const errId = useId();
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
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={`w-full rounded-lg border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground transition-colors focus:outline-none focus:ring-2 ${
          error
            ? "border-danger-active focus:border-danger-active focus:ring-danger-soft"
            : "border-edge-input focus:border-primary-active focus:ring-ring-soft"
        }`}
      />
      {error && (
        <span id={errId} role="alert" className="mt-1 block text-xs text-danger">
          {error}
        </span>
      )}
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
