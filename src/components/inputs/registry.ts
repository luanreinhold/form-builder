import type { CategoryId, FieldType, RegistryEntry } from "@/types";

const baseDefaults = (name: string) => ({
  name,
  label: name,
  required: false,
});

export const REGISTRY: Record<FieldType, RegistryEntry> = {
  "input-text": {
    type: "input-text",
    label: "Texto",
    category: "texto",
    defaultProps: {
      ...baseDefaults("texto"),
      doNotAllowSpecialCharacters: false,
    },
  },
  "input-textarea": {
    type: "input-textarea",
    label: "Textarea",
    category: "texto",
    defaultProps: baseDefaults("descricao"),
  },
  "input-email": {
    type: "input-email",
    label: "E-mail",
    category: "texto",
    defaultProps: baseDefaults("email"),
  },
  "input-password": {
    type: "input-password",
    label: "Senha",
    category: "texto",
    defaultProps: baseDefaults("senha"),
  },
  "input-number": {
    type: "input-number",
    label: "Número",
    category: "numerico",
    defaultProps: baseDefaults("numero"),
  },
  "input-decimal": {
    type: "input-decimal",
    label: "Decimal",
    category: "numerico",
    defaultProps: baseDefaults("decimal"),
  },
  "input-money": {
    type: "input-money",
    label: "Dinheiro",
    category: "numerico",
    defaultProps: { ...baseDefaults("valor"), minValue: 0 },
  },
  "input-date": {
    type: "input-date",
    label: "Data",
    category: "dataHora",
    defaultProps: { ...baseDefaults("data"), format: "dd/MM/yyyy" },
  },
  "input-time": {
    type: "input-time",
    label: "Hora",
    category: "dataHora",
    defaultProps: baseDefaults("hora"),
  },
  "input-cpf": {
    type: "input-cpf",
    label: "CPF",
    category: "documentosBr",
    defaultProps: baseDefaults("cpf"),
  },
  "input-cnpj": {
    type: "input-cnpj",
    label: "CNPJ",
    category: "documentosBr",
    defaultProps: baseDefaults("cnpj"),
  },
  "input-rg": {
    type: "input-rg",
    label: "RG",
    category: "documentosBr",
    defaultProps: baseDefaults("rg"),
  },
  "input-pis": {
    type: "input-pis",
    label: "PIS",
    category: "documentosBr",
    defaultProps: baseDefaults("pis"),
  },
  "input-phone": {
    type: "input-phone",
    label: "Telefone",
    category: "texto",
    defaultProps: baseDefaults("telefone"),
  },
  "input-mask": {
    type: "input-mask",
    label: "Máscara",
    category: "avancado",
    defaultProps: { ...baseDefaults("campo"), mask: "" },
  },
  "input-color": {
    type: "input-color",
    label: "Cor",
    category: "avancado",
    defaultProps: baseDefaults("cor"),
  },
  "input-attach": {
    type: "input-attach",
    label: "Anexo",
    category: "upload",
    defaultProps: { ...baseDefaults("anexo"), multiple: false },
  },
  "input-modal": {
    type: "input-modal",
    label: "Modal",
    category: "modalLookup",
    defaultProps: { ...baseDefaults("selecao"), allowFields: [], redirectFields: {} },
  },
  "input-cep-modal": {
    type: "input-cep-modal",
    label: "CEP (Modal)",
    category: "modalLookup",
    defaultProps: baseDefaults("cep"),
  },
  "input-json": {
    type: "input-json",
    label: "JSON",
    category: "avancado",
    defaultProps: baseDefaults("dados"),
  },
  "input-ocr": {
    type: "input-ocr",
    label: "OCR",
    category: "avancado",
    defaultProps: baseDefaults("ocr"),
  },
  "input-report": {
    type: "input-report",
    label: "Relatório",
    category: "avancado",
    defaultProps: baseDefaults("relatorio"),
  },
  "select-multiple": {
    type: "select-multiple",
    label: "Select Múltiplo",
    category: "selecao",
    defaultProps: { ...baseDefaults("selecao"), source: [] },
  },
  "select-search": {
    type: "select-search",
    label: "Select Busca",
    category: "selecao",
    defaultProps: { ...baseDefaults("selecao"), source: [] },
  },
  "dynamic-select": {
    type: "dynamic-select",
    label: "Select Dinâmico",
    category: "selecao",
    defaultProps: {
      ...baseDefaults("selecao"),
      entity: "",
      filters: {},
      fields: { key: "", value: "" },
      redirectFields: {},
    },
  },
  "radio-component": {
    type: "radio-component",
    label: "Radio",
    category: "selecao",
    defaultProps: {
      ...baseDefaults("opcao"),
      source: [],
      selected: "",
      vertical: false,
    },
  },
  "divider-component": {
    type: "divider-component",
    label: "Divisória",
    category: "avancado",
    defaultProps: {
      name: "divider",
      label: "Divisória",
      transformDivider: "",
    },
  },
};

export function getRegistry(type: FieldType): RegistryEntry {
  const entry = REGISTRY[type];
  if (!entry) throw new Error(`Tipo desconhecido: ${type}`);
  return entry;
}

export function listByCategory(): Array<{
  category: CategoryId;
  items: RegistryEntry[];
}> {
  const groups = new Map<CategoryId, RegistryEntry[]>();
  for (const entry of Object.values(REGISTRY)) {
    if (!groups.has(entry.category)) groups.set(entry.category, []);
    groups.get(entry.category)?.push(entry);
  }
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}
