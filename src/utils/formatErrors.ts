import { REGISTRY } from "@/components/inputs/registry";

/**
 * Mensagens de erro para Consultores (nao-desenvolvedores): nunca expoem o
 * caminho JSON (`fields.0.props.name`), nomes internos de props ou texto em
 * ingles do Zod/JSON.parse. Todo erro referencia o campo pelo rotulo + posicao.
 */

/** Item tolerante: o import formata erros antes de o Zod validar o campo. */
export interface FieldLike {
  type?: unknown;
  props?: unknown;
}

/** Subconjunto de ZodIssue usado aqui — evita acoplar os helpers ao Zod. */
export interface IssueLike {
  path: (string | number)[];
  message: string;
}

/** Nome amigavel do tipo: reaproveita o rotulo da paleta (fonte unica). */
const FIELD_TYPE_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(REGISTRY).map((entry) => [entry.type, entry.label]),
);

/** Props do campo (inclui as diretivas base) na nomenclatura do painel. */
const PROP_NAMES: Record<string, string> = {
  // identificacao
  name: "Identificador",
  label: "Título",
  placeholder: "Placeholder",
  hint: "Dica",
  customRequiredWarning: "Aviso de campo obrigatório",
  labelClass: "Classe da label",
  fontSize: "Tamanho da fonte",
  // comportamento
  required: "Obrigatório",
  readonly: "Somente leitura",
  showCaracterCounter: "Contador de caracteres",
  highlight: "Destaque",
  doNotTranslate: "Não traduzir",
  requestFocus: "Foco automático",
  value: "Valor",
  keyboardOptions: "Opções de teclado",
  // limites
  min: "Quantidade mínima",
  max: "Quantidade máxima",
  minValue: "Valor mínimo",
  maxValue: "Valor máximo",
  minDate: "Data mínima",
  maxDate: "Data máxima",
  format: "Formato",
  // selecao / busca
  source: "Lista de opções",
  selected: "Opção selecionada",
  checked: "Marcado",
  vertical: "Exibição vertical",
  expand: "Expandir",
  optionLabel: "Rótulo da opção",
  optionValue: "Valor da opção",
  key: "Chave",
  entity: "Entidade",
  fields: "Mapeamento de campos",
  filters: "Filtros",
  redirectFields: "Campos de redirecionamento",
  allowFields: "Campos permitidos",
  modalProps: "Configuração do modal",
  // avancado
  mask: "Máscara",
  clearSpecialCharacter: "Remover caracteres especiais",
  doNotAllowSpecialCharacters: "Bloquear caracteres especiais",
  toastrMessage: "Mensagem de aviso",
  accept: "Tipos de arquivo aceitos",
  multiple: "Múltiplos arquivos",
  ocrConfig: "Configuração de OCR",
  reportConfig: "Configuração do relatório",
  transformDivider: "Estilo da divisória",
  // diretivas base do campo
  type: "Tipo do campo",
  class: "Classe CSS",
  hide: "Oculto",
  colSpan: "Largura",
};

/** Chaves da raiz do arquivo — `fields` aqui e a lista, nao a prop do select. */
const FORM_PROP_NAMES: Record<string, string> = {
  schemaVersion: "Versão do formato",
  formId: "Identificador do formulário",
  createdAt: "Data de criação",
  updatedAt: "Data de atualização",
  fields: "Lista de campos",
};

/** Mensagens Zod sem parametros (inclui as customizadas dos schemas). */
const ZOD_TRANSLATIONS: Record<string, string> = {
  Required: "não foi preenchido",
  "Invalid input": "valor inválido",
  "Invalid email": "e-mail inválido",
  "Invalid url": "endereço inválido",
  "Invalid date": "data inválida",
  "Expected integer, received float": "deve ser um número inteiro",
  "name é obrigatório": "não foi preenchido",
};

const ZOD_TYPE_NAMES: Record<string, string> = {
  string: "texto",
  number: "número",
  boolean: "sim/não",
  array: "lista",
  object: "objeto",
  null: "vazio",
  undefined: "vazio",
  nan: "número inválido",
  date: "data",
  integer: "número inteiro",
  float: "número decimal",
};

/** Mensagens Zod com parametros — a ordem importa (a 1a que casar vence). */
const ZOD_PATTERNS: { pattern: RegExp; translate: (match: RegExpExecArray) => string }[] = [
  {
    pattern: /^Expected (\w+), received (\w+)$/,
    translate: (m) => `esperado ${translateZodType(m[1])}, recebido ${translateZodType(m[2])}`,
  },
  {
    pattern: /^String must contain at least (\d+) character/,
    translate: (m) =>
      m[1] === "1" ? "não pode ficar vazio" : `deve ter no mínimo ${m[1]} caracteres`,
  },
  {
    pattern: /^String must contain at most (\d+) character/,
    translate: (m) => `deve ter no máximo ${m[1]} caracteres`,
  },
  {
    pattern: /^Array must contain at least (\d+) element/,
    translate: (m) => (m[1] === "1" ? "precisa ter ao menos um item" : `precisa ter ${m[1]} itens`),
  },
  {
    pattern: /^Number must be greater than or equal to (.+)$/,
    translate: (m) => `deve ser no mínimo ${m[1]}`,
  },
  {
    pattern: /^Number must be less than or equal to (.+)$/,
    translate: (m) => `deve ser no máximo ${m[1]}`,
  },
  { pattern: /^Number must be greater than (.+)$/, translate: (m) => `deve ser maior que ${m[1]}` },
  { pattern: /^Number must be less than (.+)$/, translate: (m) => `deve ser menor que ${m[1]}` },
  // "Invalid discriminator value. Expected 'input-text' | ..." despejaria a
  // lista inteira de tipos internos na tela.
  { pattern: /^Invalid discriminator value/, translate: () => "tipo de campo não reconhecido" },
  { pattern: /^Invalid literal value/, translate: () => "valor não suportado" },
  { pattern: /^Invalid enum value/, translate: () => "valor fora das opções permitidas" },
  { pattern: /^Unrecognized key/, translate: () => "propriedade não reconhecida" },
];

/** Erro cru do JSON.parse → diagnostico acionavel (a 1a que casar vence). */
const JSON_ERROR_PATTERNS: { pattern: RegExp; diagnostic: string }[] = [
  {
    pattern: /Unexpected end of (JSON input|input|data)/i,
    diagnostic:
      "o conteúdo termina antes do esperado — verifique se colou o texto inteiro e se todas as chaves { } e colchetes [ ] foram fechados",
  },
  { pattern: /Unterminated string/i, diagnostic: "há um texto entre aspas que não foi fechado" },
  {
    pattern: /Expected property name or '}'/i,
    diagnostic: "falta o nome de uma propriedade ou há uma vírgula sobrando antes de }",
  },
  { pattern: /Expected ',' or '}'/i, diagnostic: "falta uma vírgula entre duas propriedades" },
  { pattern: /Expected ',' or ']'/i, diagnostic: "falta uma vírgula entre dois itens da lista" },
  {
    pattern: /Expected ':'/i,
    diagnostic: "falta o sinal de dois-pontos entre o nome da propriedade e o valor",
  },
  {
    pattern: /Expected double-quoted property name/i,
    diagnostic: "os nomes das propriedades precisam estar entre aspas duplas",
  },
  {
    pattern: /non-whitespace character after JSON/i,
    diagnostic: "há conteúdo sobrando depois do fim do JSON",
  },
  {
    pattern: /Bad (escaped|control|Unicode)/i,
    diagnostic: "há um caractere inválido dentro de um texto entre aspas",
  },
  {
    pattern: /Unexpected token|Unexpected (string|number|identifier)/i,
    diagnostic: "há um caractere fora do lugar",
  },
];

const JSON_FALLBACK_DIAGNOSTIC = "o conteúdo não está no formato JSON";

function ordinal(index: number): string {
  return `${index + 1}º`;
}

function translateZodType(type: string): string {
  return ZOD_TYPE_NAMES[type] ?? type;
}

/** Ex.: `Campo "Nome completo" (1º)`. Tolera itens ainda nao validados. */
export function formatFieldReference(field: FieldLike, index: number): string {
  const position = `(${ordinal(index)})`;
  const props =
    field?.props && typeof field.props === "object"
      ? (field.props as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const label = typeof props.label === "string" ? props.label.trim() : "";
  if (label) return `Campo "${label}" ${position}`;
  const name = typeof props.name === "string" ? props.name.trim() : "";
  if (name) return `Campo "${name}" ${position}`;
  const type = typeof field?.type === "string" ? field.type.trim() : "";
  if (type) return `Campo do tipo "${formatFieldTypeName(type)}" ${position}`;
  return `Campo ${position}`;
}

/** `dynamic-select` → `Select Dinâmico`. Desconhecido volta como veio. */
export function formatFieldTypeName(type: string): string {
  return FIELD_TYPE_NAMES[type] ?? type;
}

/** `customRequiredWarning` → `Aviso de campo obrigatório`. */
export function formatPropName(prop: string): string {
  return PROP_NAMES[prop] ?? prop;
}

/** Sem traducao conhecida a mensagem original e mantida (nunca some o erro). */
export function translateZodMessage(message: string): string {
  const exact = ZOD_TRANSLATIONS[message];
  if (exact) return exact;
  for (const { pattern, translate } of ZOD_PATTERNS) {
    const match = pattern.exec(message);
    if (match) return translate(match);
  }
  return message;
}

/** Erro do JSON.parse em portugues; `source` permite apontar linha/coluna. */
export function friendlyJsonError(err: unknown, source?: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const diagnostic =
    JSON_ERROR_PATTERNS.find(({ pattern }) => pattern.test(raw))?.diagnostic ??
    JSON_FALLBACK_DIAGNOSTIC;
  const place = describePosition(raw, source);
  return place
    ? `Não foi possível ler o JSON: ${diagnostic} ${place}`
    : `Não foi possível ler o JSON: ${diagnostic}`;
}

/** V8 recente ja informa linha/coluna; caso contrario deriva de `position`. */
function describePosition(message: string, source?: string): string {
  const lineColumn = /line (\d+) column (\d+)/i.exec(message);
  if (lineColumn) return `(linha ${lineColumn[1]}, coluna ${lineColumn[2]})`;
  const positionMatch = /at position (\d+)/i.exec(message);
  if (!positionMatch) return "";
  const position = Number(positionMatch[1]);
  if (typeof source !== "string") return `(caractere ${position + 1})`;
  const before = source.slice(0, position);
  const line = before.split("\n").length;
  const column = position - before.lastIndexOf("\n");
  return `(linha ${line}, coluna ${column})`;
}

/** Caminho do issue como trilha de rotulos; `props` e indices viram posicao. */
function formatPropPath(path: (string | number)[], names = PROP_NAMES): string {
  return path
    .filter((segment) => segment !== "props")
    .map((segment) =>
      typeof segment === "number" ? `${ordinal(segment)} item` : (names[segment] ?? segment),
    )
    .join(" → ");
}

/** Issue com caminho relativo ao campo (ex.: `props.name`). */
export function formatFieldIssue(issue: IssueLike, field: FieldLike, index: number): string {
  const reference = formatFieldReference(field, index);
  const prop = formatPropPath(issue.path);
  const message = translateZodMessage(issue.message);
  return prop ? `${reference} — ${prop}: ${message}` : `${reference}: ${message}`;
}

/** Issue com caminho relativo ao formulario inteiro (ex.: `fields.0.props.name`). */
export function formatFormIssue(issue: IssueLike, fields: readonly FieldLike[]): string {
  const [head, index, ...rest] = issue.path;
  if (head === "fields" && typeof index === "number") {
    return formatFieldIssue({ path: rest, message: issue.message }, fields[index] ?? {}, index);
  }
  const prop = formatPropPath(issue.path, { ...PROP_NAMES, ...FORM_PROP_NAMES });
  const message = translateZodMessage(issue.message);
  return prop ? `Arquivo inválido — ${prop}: ${message}` : `Arquivo inválido: ${message}`;
}

/** Atalho para `FormSchema.safeParse(payload)` que falhou. */
export function formatFormErrors(issues: readonly IssueLike[], payload: unknown): string[] {
  const raw = (payload as { fields?: unknown } | null | undefined)?.fields;
  const fields: FieldLike[] = Array.isArray(raw) ? (raw as FieldLike[]) : [];
  return issues.map((issue) => formatFormIssue(issue, fields));
}
