interface Props {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function BooleanEditor({ label, value, onChange }: Props) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-edge-input bg-card text-primary focus:ring-2 focus:ring-ring"
      />
      <span>{label}</span>
    </label>
  );
}
