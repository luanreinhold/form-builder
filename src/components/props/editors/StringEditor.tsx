import { useId } from "react";

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
  const errId = useId();
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={`w-full rounded-lg border bg-card px-2.5 py-1.5 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 ${
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
