import type { Field } from "@/schemas/inputs.schema";
import { BASE_BOOLEAN_PROPS, BASE_STRING_PROPS } from "./propConfig";
import type { Specific } from "./specificEditors";

export function listSpecificProps(field: Field): Specific[] {
  const base = new Set<string>([
    ...BASE_STRING_PROPS,
    ...BASE_BOOLEAN_PROPS,
    "value",
    "keyboardOptions",
  ]);
  const items: Specific[] = [];
  for (const [key, value] of Object.entries(field.props as Record<string, unknown>)) {
    if (base.has(key)) continue;
    const kind: Specific["kind"] =
      typeof value === "boolean"
        ? "boolean"
        : typeof value === "number"
          ? "number"
          : value && typeof value === "object"
            ? "json"
            : "string";
    items.push({ key, kind });
  }
  return items;
}
