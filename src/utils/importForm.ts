import { type FormPayload, FormSchema } from "@/schemas/form.schema";

export type ImportResult = { ok: true; data: FormPayload } | { ok: false; errors: string[] };

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
  const parsed = FormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  return { ok: true, data: parsed.data };
}
