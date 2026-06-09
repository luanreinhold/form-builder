import { FormSchema, type FormPayload } from "@/schemas/form.schema";

export interface ExportResult {
  ok: boolean;
  data?: FormPayload;
  errors?: string[];
}

export function buildExport(payload: FormPayload): ExportResult {
  const parsed = FormSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { ok: true, data: parsed.data };
}

export function serializeForm(payload: FormPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function downloadForm(payload: FormPayload, filename = "form.json"): void {
  const blob = new Blob([serializeForm(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyFormToClipboard(payload: FormPayload): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(serializeForm(payload));
    return true;
  } catch {
    return false;
  }
}
