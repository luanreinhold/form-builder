import { type FormPayload, FormSchema } from "@/schemas/form.schema";
import type { Field } from "@/schemas/inputs.schema";
import type { FormSourceItem } from "@/types/formSourceItem";

export interface ExportResult {
  ok: boolean;
  data?: FormSourceItem[];
  errors?: string[];
}

/** Converte min/max numericos para number (a v3 espera ex.: "max": 45) e remove chaves undefined. */
function pruneProps(props: Field["props"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (
      (key === "min" || key === "max") &&
      typeof value === "string" &&
      value.trim() !== "" &&
      !Number.isNaN(Number(value))
    ) {
      out[key] = Number(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

const COL_MD_TOKEN = /\bcol-md-\d{1,2}\b/g;

/**
 * Classe vazia gera o padrao `d-block mb-2 col-md-N`. Classe customizada e
 * preservada e recebe o `col-md-N` do colSpan ao final; qualquer `col-md-*`
 * ja presente na classe e descartado (o colSpan do campo prevalece).
 */
function mergeClass(field: Field): string {
  const custom = (field.class ?? "").trim();
  if (!custom) return `d-block mb-2 col-md-${field.colSpan}`;
  const withoutColMd = custom.replace(COL_MD_TOKEN, "").replace(/\s+/g, " ").trim();
  return `${withoutColMd} col-md-${field.colSpan}`.trim();
}

function toV3SourceItem(field: Field): FormSourceItem {
  const item: FormSourceItem = {
    type: field.type,
    class: mergeClass(field),
    props: pruneProps(field.props),
  };
  if (field.hide) item.hide = true;
  return item;
}

/** Mapeia o payload interno do builder para a lista IFormSourceItem[] consumida pela v3. */
export function toV3SourceList(payload: FormPayload): FormSourceItem[] {
  return payload.fields.map(toV3SourceItem);
}

export function buildExport(payload: FormPayload): ExportResult {
  const parsed = FormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  // dynamic-select exige `entity` preenchido para consultar o backend; barra aqui
  // (e nao no schema) para nao derrubar rascunhos meio-preenchidos na reidratacao.
  const semEntity = parsed.data.fields
    .filter(
      (f) =>
        f.type === "dynamic-select" &&
        String((f.props as { entity?: unknown }).entity ?? "").trim() === "",
    )
    .map((f) => (f.props as { name?: string }).name ?? f.type);
  if (semEntity.length > 0) {
    return {
      ok: false,
      errors: [`dynamic-select sem entity: ${semEntity.join(", ")}`],
    };
  }
  return { ok: true, data: toV3SourceList(parsed.data) };
}

export function serializeForm(items: FormSourceItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function downloadForm(items: FormSourceItem[], filename = "form.json"): void {
  const blob = new Blob([serializeForm(items)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyFormToClipboard(items: FormSourceItem[]): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(serializeForm(items));
    return true;
  } catch {
    return false;
  }
}
