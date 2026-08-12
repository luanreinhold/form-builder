import type { FieldType, RegistryEntry } from "@/types";

const baseDefaults = (name: string) => ({
  name,
  label: name,
  required: false,
});

export const REGISTRY: Record<FieldType, RegistryEntry> = {
  "input-text": {
    type: "input-text",
    label: "Texto",
    category: "Texto",
    defaultProps: {
      ...baseDefaults("texto"),
      doNotAllowSpecialCharacters: false,
    },
  },
  "input-textarea": {
    type: "input-textarea",
    label: "Textarea",
    category: "Texto",
    defaultProps: baseDefaults("descricao"),
  },
  "input-email": {
    type: "input-email",
    label: "E-mail",
    category: "Texto",
    defaultProps: baseDefaults("email"),
  },
  "input-password": {
    type: "input-password",
    label: "Senha",
    category: "Texto",
    defaultProps: baseDefaults("senha"),
  },
  "input-number": {
    type: "input-number",
    label: "Número",
    category: "Numérico",
    defaultProps: baseDefaults("numero"),
  },
  "input-decimal": {
    type: "input-decimal",
    label: "Decimal",
    category: "Numérico",
    defaultProps: baseDefaults("decimal"),
  },
  "input-money": {
    type: "input-money",
    label: "Dinheiro",
    category: "Numérico",
    defaultProps: { ...baseDefaults("valor"), minValue: 0 },
  },
  "input-date": {
    type: "input-date",
    label: "Data",
    category: "Data/Hora",
    defaultProps: { ...baseDefaults("data"), format: "dd/MM/yyyy" },
  },
  "input-time": {
    type: "input-time",
    label: "Hora",
    category: "Data/Hora",
    defaultProps: baseDefaults("hora"),
  },
  "input-cpf": {
    type: "input-cpf",
    label: "CPF",
    category: "Documentos BR",
    defaultProps: baseDefaults("cpf"),
  },
  "input-cnpj": {
    type: "input-cnpj",
    label: "CNPJ",
    category: "Documentos BR",
    defaultProps: baseDefaults("cnpj"),
  },
  "input-rg": {
    type: "input-rg",
    label: "RG",
    category: "Documentos BR",
    defaultProps: baseDefaults("rg"),
  },
  "input-pis": {
    type: "input-pis",
    label: "PIS",
    category: "Documentos BR",
    defaultProps: baseDefaults("pis"),
  },
  "input-phone": {
    type: "input-phone",
    label: "Telefone",
    category: "Texto",
    defaultProps: baseDefaults("telefone"),
  },
  "input-mask": {
    type: "input-mask",
    label: "Máscara",
    category: "Avançado",
    defaultProps: { ...baseDefaults("campo"), mask: "" },
  },
  "input-color": {
    type: "input-color",
    label: "Cor",
    category: "Avançado",
    defaultProps: baseDefaults("cor"),
  },
  "input-attach": {
    type: "input-attach",
    label: "Anexo",
    category: "Upload",
    defaultProps: { ...baseDefaults("anexo"), multiple: false },
  },
  "input-modal": {
    type: "input-modal",
    label: "Modal",
    category: "Modal/Lookup",
    defaultProps: { ...baseDefaults("selecao"), allowFields: [], redirectFields: {} },
  },
  "input-cep-modal": {
    type: "input-cep-modal",
    label: "CEP (Modal)",
    category: "Modal/Lookup",
    defaultProps: baseDefaults("cep"),
  },
  "input-json": {
    type: "input-json",
    label: "JSON",
    category: "Avançado",
    defaultProps: baseDefaults("dados"),
  },
  "input-ocr": {
    type: "input-ocr",
    label: "OCR",
    category: "Avançado",
    defaultProps: baseDefaults("ocr"),
  },
  "input-report": {
    type: "input-report",
    label: "Relatório",
    category: "Avançado",
    defaultProps: baseDefaults("relatorio"),
  },
  "select-multiple": {
    type: "select-multiple",
    label: "Select Múltiplo",
    category: "Seleção",
    defaultProps: { ...baseDefaults("selecao"), source: [] },
  },
  "select-search": {
    type: "select-search",
    label: "Select Busca",
    category: "Seleção",
    defaultProps: { ...baseDefaults("selecao"), source: [] },
  },
  "dynamic-select": {
    type: "dynamic-select",
    label: "Select Dinâmico",
    category: "Seleção",
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
    category: "Seleção",
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
    category: "Avançado",
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
  category: string;
  items: RegistryEntry[];
}> {
  const groups = new Map<string, RegistryEntry[]>();
  for (const entry of Object.values(REGISTRY)) {
    if (!groups.has(entry.category)) groups.set(entry.category, []);
    groups.get(entry.category)?.push(entry);
  }
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}
