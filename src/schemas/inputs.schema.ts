import { z } from "zod";
import { BaseInputPropsSchema } from "./base.schema";

// `.passthrough()` preserva props da v3 que o builder (ainda) nao declara —
// ex.: conditions, components, crudPanel. Sem isso o Zod as descartaria em
// silencio no import/persist e o re-export sairia sem elas.
// Lacunas conhecidas mapeadas em docs/v3-props-gaps.md.
const wrap = <T extends z.AnyZodObject>(typeLiteral: string, propsSchema: T) =>
  z.object({
    id: z.string().min(1),
    type: z.literal(typeLiteral),
    class: z.string().optional().default(""),
    hide: z.boolean().optional().default(false),
    colSpan: z.number().int().min(1).max(12).optional().default(12),
    props: propsSchema.passthrough(),
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
// entity/allowFields/redirectFields espelham IInputModalProperties da populis-v3-core:
// redirectFields mapeia { nomeDoCampoDoFormulario: propriedadeDoItemSelecionado }.
// entity e obrigatoria na v3 (consulta ao backend) — default "" aqui para nao
// derrubar rascunhos na reidratacao; o export barra quando vazia (buildExport).
const ModalInput = wrap(
  "input-modal",
  BaseInputPropsSchema.extend({
    entity: z.string().optional().default(""),
    modalProps: z.record(z.unknown()).optional(),
    allowFields: z.array(z.string()).optional(),
    redirectFields: z.record(z.string()).optional(),
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
  selected: z.boolean().optional(),
  icon: z.string().optional(),
});
const SelectBase = BaseInputPropsSchema.extend({
  source: z.array(SelectSourceItem).optional(),
  expand: z.boolean().optional(),
  optionLabel: z.string().optional(),
  optionValue: z.string().optional(),
});
const SelectMultiple = wrap("select-multiple", SelectBase);
const SelectSearch = wrap("select-search", SelectBase);

// radio-component usa source { label, value } — semantica INVERTIDA em relacao
// aos selects ({ key, value }): aqui `label` e o texto exibido e `value` e o
// valor armazenado (string ou numero). Espelha radio.component.ts da v3.
const RadioSourceItem = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  selected: z.boolean().optional(),
});
// O builder nao expoe sourceType (predefinicoes 'yes-no'/'active-inactive' da
// v3): o source e sempre montado manualmente. Forms importados com sourceType
// seguem validos via passthrough.
const RadioProps = BaseInputPropsSchema.extend({
  source: z.array(RadioSourceItem).optional(),
  selected: z.union([z.string(), z.number()]).optional(),
  vertical: z.boolean().optional(),
});
const Radio = wrap("radio-component", RadioProps);

// divider-component estende BaseComponent (nao InputBaseComponent) na v3 —
// nao e um input: nada de placeholder/required/value, e `name` e opcional
// (usado apenas como alvo de acoes hideById do form-panel). transformDivider
// preenchido troca o label por um <hr> com essa classe ('medium' 2px,
// 'large' 4px; vazio renderiza o label). Espelha divider.component.ts da v3.
const DividerProps = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  labelClass: z.string().optional(),
  fontSize: z.string().optional(),
  doNotTranslate: z.boolean().optional(),
  transformDivider: z.string().optional(),
});
const Divider = wrap("divider-component", DividerProps);

// dynamic-select busca opcoes no backend via `entity` e mapeia a resposta com
// `fields` (objeto chave/valor) — nao usa `source` (lista estatica).
// Espelha IDynamicSelectProperties da populis-v3-core.
const DynamicSelectProps = BaseInputPropsSchema.extend({
  entity: z.string().optional().default(""),
  fields: z
    .object({
      key: z.string().optional().default(""),
      value: z.string().optional().default(""),
    })
    .optional()
    .default({ key: "", value: "" }),
  filters: z.record(z.unknown()).optional().default({}),
  redirectFields: z.record(z.string()).optional(),
});
const DynamicSelect = wrap("dynamic-select", DynamicSelectProps);

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
  Radio,
  Divider,
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
  "radio-component",
  "divider-component",
] as const satisfies readonly FieldType[];
