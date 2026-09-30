import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export type FiltersValue = Record<string, string | number>;

interface Row {
  id: number;
  key: string;
  /** Texto cru do input — convertido por parseFilterValue na emissao. */
  raw: string;
}

interface Props {
  label: string;
  value: unknown;
  onChange: (v: FiltersValue) => void;
}

const inputClass =
  "w-full rounded-lg border border-edge-input bg-card px-2.5 py-1.5 text-sm text-foreground transition-colors focus:border-primary-active focus:outline-none focus:ring-2 focus:ring-ring-soft";

/** Texto numerico vira number (`"-1"` → `-1`); o resto fica string. */
export function parseFilterValue(raw: string): string | number {
  if (raw.trim() === "") return raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

/**
 * true quando `value` pode ser editado pelo FiltersEditor: objeto (ou ausente)
 * cujos valores sao todos string/number. Filtros v3 importados com booleanos,
 * valores aninhados ou null caem no JsonEditor para nao perder o tipo.
 */
export function isPrimitiveRecord(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === "string" || typeof v === "number");
}

function normalize(value: unknown): FiltersValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: FiltersValue = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "number") out[k] = v;
  }
  return out;
}

let nextId = 0;

function toRows(value: FiltersValue): Row[] {
  return Object.entries(value).map(([key, v]) => ({ id: nextId++, key, raw: String(v) }));
}

/** Converte as linhas no dicionario. Linhas com chave vazia sao ignoradas; em chave duplicada vale a primeira. */
function evaluate(rows: Row[]): { result: FiltersValue; duplicates: boolean[] } {
  const result: FiltersValue = {};
  const seen = new Set<string>();
  const duplicates = rows.map((row) => {
    if (row.key === "") return false;
    if (seen.has(row.key)) return true;
    seen.add(row.key);
    result[row.key] = parseFilterValue(row.raw);
    return false;
  });
  return { result, duplicates };
}

function sameRecord(a: FiltersValue, b: FiltersValue): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
}

/**
 * FiltersEditor — edita o `filters` do dynamic-select: dicionario livre
 * `{ atributo: valor }` enviado na consulta ao backend
 * (ex.: `{ nuwRowsPerPage: -1, atrIdPessoa: 15322 }`).
 *
 * Um input para a chave e outro para o valor; o tipo do valor e inferido do
 * texto (numerico → number, resto → string). As linhas vivem em estado local
 * (array) para permitir chave vazia/duplicada durante a digitacao, preservar a
 * ordem e o texto cru (ex.: "1." enquanto se digita "1.5").
 */
export function FiltersEditor({ label, value, onChange }: Props) {
  const [rows, setRows] = useState<Row[]>(() => toRows(normalize(value)));
  // Ultimo dicionario emitido/recebido — distingue o eco do proprio onChange
  // de uma mudanca externa (import/undo).
  const lastSyncedRef = useRef<FiltersValue>(normalize(value));

  useEffect(() => {
    const incoming = normalize(value);
    if (sameRecord(lastSyncedRef.current, incoming)) return;
    lastSyncedRef.current = incoming;
    setRows(toRows(incoming));
  }, [value]);

  const { duplicates } = evaluate(rows);

  function commit(next: Row[]) {
    setRows(next);
    const { result } = evaluate(next);
    lastSyncedRef.current = result;
    onChange(result);
  }

  function updateRow(id: number, patch: Partial<Row>) {
    commit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows([...rows, { id: nextId++, key: "", raw: "" }]);
  }

  function removeRow(id: number) {
    commit(rows.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-edge-input px-3 py-3 text-xs text-faint">
          Nenhum filtro. Adicione pares atributo/valor enviados na consulta à entidade.
        </p>
      )}
      {rows.map((row, index) => {
        const n = index + 1;
        const duplicate = duplicates[index];
        return (
          <div
            key={row.id}
            className={`space-y-1.5 rounded-lg border p-2 ${
              duplicate ? "border-amber-500/60 bg-amber-500/5" : "border-edge-input"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                aria-label={`Identificador do filtro ${n}`}
                value={row.key}
                onChange={(e) => updateRow(row.id, { key: e.target.value })}
                placeholder="Identificador (ex.: atrIdPessoa)"
                className={`${inputClass} min-w-0 flex-1`}
              />
              <input
                aria-label={`Valor do filtro ${n}`}
                value={row.raw}
                onChange={(e) => updateRow(row.id, { raw: e.target.value })}
                placeholder="Valor (ex.: 15322)"
                className={`${inputClass} min-w-0 flex-1`}
              />
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Remover filtro ${n}`}
                onClick={() => removeRow(row.id)}
              >
                Remover
              </Button>
            </div>
            {duplicate && (
              <p role="alert" className="text-[11px] text-amber-600 dark:text-amber-400">
                Identificador "{row.key}" duplicado — apenas a primeira ocorrência é exportada.
              </p>
            )}
          </div>
        );
      })}
      <Button variant="secondary" size="sm" onClick={addRow}>
        Adicionar filtro
      </Button>
    </div>
  );
}
