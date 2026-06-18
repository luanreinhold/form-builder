import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export interface SourceItem {
  key: string | number;
  value: string;
  selected?: boolean;
  icon?: string;
}

interface Props {
  label: string;
  value: unknown;
  onChange: (v: SourceItem[] | undefined) => void;
}

const inputClass =
  "w-full rounded-lg border border-edge-input bg-card px-2.5 py-1.5 text-sm text-foreground transition-colors focus:border-primary-active focus:outline-none focus:ring-2 focus:ring-ring-soft";

function normalize(value: unknown): SourceItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SourceItem =>
      !!item && typeof item === "object" && "key" in item && "value" in item,
  );
}

export function SourceEditor({ label, value, onChange }: Props) {
  const items = normalize(value);
  const [mode, setMode] = useState<"form" | "json">("form");

  const emit = (next: SourceItem[]) => onChange(next.length ? next : []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode((m) => (m === "form" ? "json" : "form"))}
        >
          {mode === "form" ? "JSON" : "Formulário"}
        </Button>
      </div>

      {mode === "json" ? (
        <JsonMode items={items} onChange={onChange} />
      ) : (
        <FormMode items={items} emit={emit} />
      )}
    </div>
  );
}

function FormMode({ items, emit }: { items: SourceItem[]; emit: (next: SourceItem[]) => void }) {
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");
  const [selected, setSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function add() {
    const trimmedKey = key.trim();
    const trimmedVal = val.trim() || trimmedKey;
    if (!trimmedKey) {
      setError("Informe o rótulo do item.");
      return;
    }
    if (items.some((i) => String(i.value) === trimmedVal)) {
      setError("Já existe um item com esse valor (duplicado).");
      return;
    }
    const item: SourceItem = { key: trimmedKey, value: trimmedVal };
    if (selected) item.selected = true;
    emit([...items, item]);
    setKey("");
    setVal("");
    setSelected(false);
    setError(null);
  }

  function update(index: number, patch: Partial<SourceItem>) {
    emit(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function remove(index: number) {
    emit(items.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-lg border border-edge bg-surface/40 p-2">
        <input
          aria-label="Novo rótulo"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Rótulo exibido (ex.: Código CID)"
          className={inputClass}
        />
        <input
          aria-label="Novo valor"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Valor armazenado (ex.: CID)"
          className={inputClass}
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => setSelected(e.target.checked)}
              className="h-4 w-4 rounded border-edge-input bg-card text-primary focus:ring-2 focus:ring-ring"
            />
            <span>Pré-selecionado</span>
          </label>
          <Button variant="secondary" size="sm" onClick={add}>
            Adicionar
          </Button>
        </div>
        {error && <span className="block text-xs text-danger">{error}</span>}
      </div>

      {items.length === 0 ? (
        <p className="px-1 text-xs text-faint">Nenhum item adicionado.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a identidade do item (lista editável/reordenável, sem id estável)
              key={index}
              className="flex items-center gap-1.5 rounded-lg border border-edge bg-card px-2 py-1.5"
            >
              <input
                aria-label="Rótulo"
                value={String(item.key)}
                onChange={(e) => update(index, { key: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label="Valor"
                value={item.value}
                onChange={(e) => update(index, { value: e.target.value })}
                className={inputClass}
              />
              <label className="flex shrink-0 items-center" title="Selecionado">
                <input
                  aria-label="Selecionado"
                  type="checkbox"
                  checked={!!item.selected}
                  onChange={(e) => update(index, { selected: e.target.checked || undefined })}
                  className="h-4 w-4 rounded border-edge-input bg-card text-primary focus:ring-2 focus:ring-ring"
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mover para cima"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mover para baixo"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
              <Button
                variant="danger"
                size="icon"
                aria-label="Remover"
                onClick={() => remove(index)}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JsonMode({
  items,
  onChange,
}: {
  items: SourceItem[];
  onChange: (v: SourceItem[] | undefined) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(items, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(items, null, 2));
    // serializa para detectar mudanças externas vindas das props
  }, [items]);

  function handleChange(next: string) {
    setText(next);
    if (next.trim() === "") {
      setError(null);
      onChange([]);
      return;
    }
    try {
      const parsed = JSON.parse(next);
      if (!Array.isArray(parsed)) throw new Error("O source deve ser um array.");
      setError(null);
      onChange(parsed as SourceItem[]);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <textarea
        aria-label="Source em JSON"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={6}
        className={`w-full rounded-lg border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground transition-colors focus:outline-none focus:ring-2 ${
          error
            ? "border-danger-active focus:border-danger-active focus:ring-danger-soft"
            : "border-edge-input focus:border-primary-active focus:ring-ring-soft"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </div>
  );
}
