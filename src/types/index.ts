export type { BaseInputProps } from "@/schemas/base.schema";
export type { FormPayload } from "@/schemas/form.schema";
export type { Field, FieldType } from "@/schemas/inputs.schema";
export { FIELD_TYPES } from "@/schemas/inputs.schema";
export type { FormSourceItem } from "@/types/formSourceItem";

export type Category =
  | "Texto"
  | "Numérico"
  | "Data/Hora"
  | "Documentos BR"
  | "Avançado"
  | "Upload"
  | "Modal/Lookup"
  | "Seleção";

export interface RegistryEntry {
  type: import("@/schemas/inputs.schema").FieldType;
  label: string;
  category: Category;
  defaultProps: Record<string, unknown>;
}
