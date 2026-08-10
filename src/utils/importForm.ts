import { type FormPayload, FormSchema } from "@/schemas/form.schema";
import { FIELD_TYPES, type Field, FieldSchema } from "@/schemas/inputs.schema";
import type { FormSourceItem } from "@/types/formSourceItem";
import { generateId } from "@/utils/id";

export type ImportResult = { ok: true; data: FormPayload } | { ok: false; errors: string[] };

/** Classe gerada pelo export quando o campo nao tem classe customizada. */
const GENERATED_CLASS = /^d-block mb-2 col-md-(\d{1,2})$/;
const COL_MD = /col-md-(\d{1,2})/;

function colSpanFromClass(cls: string): number {
  const match = COL_MD.exec(cls);
  if (!match) return 12;
  return Math.min(12, Math.max(1, Number(match[1])));
}

/** Inversa de pruneProps do export: a v3 usa min/max numericos; o builder edita como string. */
function reviveProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if ((key === "min" || key === "max") && typeof value === "number") {
      out[key] = String(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

/**
 * Inversa de toV3SourceItem do export. A lista v3 nao carrega `id` nem
 * `colSpan`: o id e gerado e o colSpan derivado do `col-md-N` da classe.
 * Classe identica a gerada pelo export volta a "" (round-trip); qualquer
 * outra e preservada como customizada. `action`/`group` da v3 sao ignorados.
 */
function fromV3SourceItem(item: FormSourceItem): unknown {
  const cls = item.class ?? "";
  return {
    id: generateId(),
    type: item.type,
    class: GENERATED_CLASS.test(cls) ? "" : cls,
    hide: item.hide === true,
    colSpan: colSpanFromClass(cls),
    props: reviveProps((item.props ?? {}) as Record<string, unknown>),
  };
}

function parseV3List(list: unknown[]): ImportResult {
  const fields: Field[] = [];
  const errors: string[] = [];
  list.forEach((raw, i) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      errors.push(`fields.${i}: item deve ser um objeto`);
      return;
    }
    const item = raw as FormSourceItem;
    if (!(FIELD_TYPES as readonly string[]).includes(String(item.type))) {
      errors.push(`fields.${i}.type: tipo desconhecido "${String(item.type)}"`);
      return;
    }
    const parsed = FieldSchema.safeParse(fromV3SourceItem(item));
    if (!parsed.success) {
      errors.push(
        ...parsed.error.issues.map((iss) => `fields.${i}.${iss.path.join(".")}: ${iss.message}`),
      );
      return;
    }
    fields.push(parsed.data);
  });
  if (errors.length > 0) return { ok: false, errors };
  const now = new Date().toISOString();
  return {
    ok: true,
    data: { schemaVersion: 1, formId: generateId(), createdAt: now, updatedAt: now, fields },
  };
}

/**
 * Aceita dois formatos:
 * - array  → lista v3 (IFormSourceItem[]), o mesmo shape que o export gera;
 * - objeto → payload interno do builder (FormPayload), backup/restore.
 */
export function parseImport(input: string | unknown): ImportResult {
  let raw: unknown = input;
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch (err) {
      return {
        ok: false,
        errors: [`JSON invalido: ${(err as Error).message}`],
      };
    }
  }
  if (Array.isArray(raw)) return parseV3List(raw);
  const parsed = FormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { ok: true, data: parsed.data };
}
