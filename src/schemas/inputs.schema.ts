import { z } from "zod";
import { BaseInputPropsSchema } from "./base.schema";

const wrap = <T extends z.ZodTypeAny>(typeLiteral: string, propsSchema: T) =>
  z.object({
    id: z.string().min(1),
    type: z.literal(typeLiteral),
    class: z.string().optional().default(""),
    hide: z.boolean().optional().default(false),
    colSpan: z.number().int().min(1).max(12).optional().default(12),
    props: propsSchema,
  });

const Text = wrap(
  "input-text",
  BaseInputPropsSchema.extend({
    doNotAllowSpecialCharacters: z.boolean().optional(),
  }),
);
const Textarea = wrap("input-textarea", BaseInputPropsSchema);
const Email = wrap("input-email", BaseInputPropsSchema);
const Password = wrap("input-password", BaseInputPropsSchema);
const NumberInput = wrap("input-number", BaseInputPropsSchema);
const Decimal = wrap("input-decimal", BaseInputPropsSchema);
const Money = wrap(
  "input-money",
  BaseInputPropsSchema.extend({
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
  }),
);
const DateInput = wrap(
  "input-date",
  BaseInputPropsSchema.extend({
    format: z.string().optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
  }),
);
const TimeInput = wrap("input-time", BaseInputPropsSchema);
const Cpf = wrap("input-cpf", BaseInputPropsSchema);
const Cnpj = wrap("input-cnpj", BaseInputPropsSchema);
const Rg = wrap("input-rg", BaseInputPropsSchema);
const Pis = wrap("input-pis", BaseInputPropsSchema);
const Phone = wrap("input-phone", BaseInputPropsSchema);
const Mask = wrap(
  "input-mask",
  BaseInputPropsSchema.extend({
    mask: z.string().optional(),
    clearSpecialCharacter: z.boolean().optional(),
    toastrMessage: z.string().optional(),
  }),
);
const Color = wrap("input-color", BaseInputPropsSchema);
const Attach = wrap(
  "input-attach",
  BaseInputPropsSchema.extend({
    accept: z.string().optional(),
    multiple: z.boolean().optional(),
  }),
);
const ModalInput = wrap(
  "input-modal",
  BaseInputPropsSchema.extend({
    modalProps: z.record(z.unknown()).optional(),
  }),
);
const CepModal = wrap(
  "input-cep-modal",
  BaseInputPropsSchema.extend({
    modalProps: z.record(z.unknown()).optional(),
  }),
);
const Json = wrap("input-json", BaseInputPropsSchema);
const Ocr = wrap(
  "input-ocr",
  BaseInputPropsSchema.extend({
    ocrConfig: z.record(z.unknown()).optional(),
  }),
);
const Report = wrap(
  "input-report",
  BaseInputPropsSchema.extend({
    reportConfig: z.record(z.unknown()).optional(),
  }),
);

const SelectSourceItem = z.object({
  key: z.union([z.string(), z.number()]),
  value: z.string(),
});
const SelectBase = BaseInputPropsSchema.extend({
  source: z.array(SelectSourceItem).optional(),
  expand: z.boolean().optional(),
  optionLabel: z.string().optional(),
  optionValue: z.string().optional(),
});
const SelectMultiple = wrap("select-multiple", SelectBase);
const SelectSearch = wrap("select-search", SelectBase);
const DynamicSelect = wrap("dynamic-select", SelectBase);

export const FieldSchema = z.discriminatedUnion("type", [
  Text,
  Textarea,
  Email,
  Password,
  NumberInput,
  Decimal,
  Money,
  DateInput,
  TimeInput,
  Cpf,
  Cnpj,
  Rg,
  Pis,
  Phone,
  Mask,
  Color,
  Attach,
  ModalInput,
  CepModal,
  Json,
  Ocr,
  Report,
  SelectMultiple,
  SelectSearch,
  DynamicSelect,
]);

export type Field = z.infer<typeof FieldSchema>;
export type FieldType = Field["type"];

export const FIELD_TYPES = [
  "input-text",
  "input-textarea",
  "input-email",
  "input-password",
  "input-number",
  "input-decimal",
  "input-money",
  "input-date",
  "input-time",
  "input-cpf",
  "input-cnpj",
  "input-rg",
  "input-pis",
  "input-phone",
  "input-mask",
  "input-color",
  "input-attach",
  "input-modal",
  "input-cep-modal",
  "input-json",
  "input-ocr",
  "input-report",
  "select-multiple",
  "select-search",
  "dynamic-select",
] as const satisfies readonly FieldType[];
