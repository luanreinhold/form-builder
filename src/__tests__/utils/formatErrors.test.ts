import { describe, expect, it } from "vitest";
import { FormSchema } from "@/schemas/form.schema";
import { FieldSchema } from "@/schemas/inputs.schema";
import {
  formatFieldIssue,
  formatFieldReference,
  formatFieldTypeName,
  formatFormErrors,
  formatFormIssue,
  formatPropName,
  friendlyJsonError,
  translateZodMessage,
} from "@/utils/formatErrors";

/** Padroes tecnicos que nunca podem chegar ao Consultor. */
const TECHNICAL =
  /fields\.\d|\bprops\.|schemaVersion|colSpan|Expected |received |Invalid |Required/;

function jsonError(input: string): string {
  try {
    JSON.parse(input);
    throw new Error("esperava JSON.parse falhar");
  } catch (err) {
    return friendlyJsonError(err, input);
  }
}

describe("formatFieldReference", () => {
  it("usa o rotulo do campo e a posicao em ordinal", () => {
    const field = { type: "input-text", props: { name: "nome", label: "Nome completo" } };
    expect(formatFieldReference(field, 0)).toBe('Campo "Nome completo" (1º)');
    expect(formatFieldReference(field, 2)).toBe('Campo "Nome completo" (3º)');
    expect(formatFieldReference(field, 9)).toBe('Campo "Nome completo" (10º)');
  });

  it("cai para o identificador quando nao ha rotulo", () => {
    expect(formatFieldReference({ type: "input-text", props: { name: "cpf" } }, 1)).toBe(
      'Campo "cpf" (2º)',
    );
  });

  it("cai para o nome amigavel do tipo quando nao ha rotulo nem identificador", () => {
    expect(formatFieldReference({ type: "dynamic-select", props: {} }, 0)).toBe(
      'Campo do tipo "Select Dinâmico" (1º)',
    );
  });

  it("usa so a posicao quando o item nao tem nada aproveitavel", () => {
    expect(formatFieldReference({}, 1)).toBe("Campo (2º)");
    expect(formatFieldReference({ props: "nao e objeto" }, 0)).toBe("Campo (1º)");
  });

  it("ignora rotulo e identificador em branco", () => {
    expect(formatFieldReference({ type: "input-cpf", props: { label: "  ", name: "" } }, 0)).toBe(
      'Campo do tipo "CPF" (1º)',
    );
  });
});

describe("formatFieldTypeName", () => {
  it("traduz os tipos internos para o rotulo da paleta", () => {
    expect(formatFieldTypeName("input-text")).toBe("Texto");
    expect(formatFieldTypeName("dynamic-select")).toBe("Select Dinâmico");
    expect(formatFieldTypeName("divider-component")).toBe("Divisória");
  });

  it("devolve o valor original quando o tipo e desconhecido", () => {
    expect(formatFieldTypeName("input-foo")).toBe("input-foo");
  });
});

describe("formatPropName", () => {
  it("traduz props para a nomenclatura do painel", () => {
    expect(formatPropName("name")).toBe("Identificador");
    expect(formatPropName("entity")).toBe("Entidade");
    expect(formatPropName("customRequiredWarning")).toBe("Aviso de campo obrigatório");
    expect(formatPropName("colSpan")).toBe("Largura");
  });

  it("devolve o valor original quando a prop e desconhecida", () => {
    expect(formatPropName("propInexistente")).toBe("propInexistente");
  });
});

describe("translateZodMessage", () => {
  it("traduz as mensagens sem parametros", () => {
    expect(translateZodMessage("Required")).toBe("não foi preenchido");
    expect(translateZodMessage("name é obrigatório")).toBe("não foi preenchido");
    expect(translateZodMessage("Invalid input")).toBe("valor inválido");
  });

  it("traduz as mensagens com parametros", () => {
    expect(translateZodMessage("Expected number, received string")).toBe(
      "esperado número, recebido texto",
    );
    expect(translateZodMessage("String must contain at least 1 character(s)")).toBe(
      "não pode ficar vazio",
    );
    expect(translateZodMessage("String must contain at least 3 character(s)")).toBe(
      "deve ter no mínimo 3 caracteres",
    );
    expect(translateZodMessage("Number must be greater than or equal to 1")).toBe(
      "deve ser no mínimo 1",
    );
    expect(translateZodMessage("Number must be less than or equal to 12")).toBe(
      "deve ser no máximo 12",
    );
  });

  it("nao despeja a lista de tipos internos do discriminated union", () => {
    const zodMessage =
      "Invalid discriminator value. Expected 'input-text' | 'input-textarea' | 'dynamic-select'";
    const translated = translateZodMessage(zodMessage);
    expect(translated).toBe("tipo de campo não reconhecido");
    expect(translated).not.toMatch(/input-text/);
  });

  it("mantem a mensagem original quando nao ha traducao (fallback)", () => {
    expect(translateZodMessage("mensagem customizada do schema")).toBe(
      "mensagem customizada do schema",
    );
  });
});

describe("friendlyJsonError", () => {
  it("explica JSON truncado sem repassar o texto em ingles", () => {
    const message = jsonError('{ "fields": [');
    expect(message).toMatch(/^Não foi possível ler o JSON: /);
    expect(message).toMatch(/termina antes do esperado/);
    expect(message).not.toMatch(/Unexpected|JSON input/);
  });

  it("explica caractere fora do lugar e aponta linha/coluna", () => {
    const message = jsonError('{\n  "a": 1,\n  x\n}');
    expect(message).toMatch(/^Não foi possível ler o JSON: /);
    expect(message).toMatch(/\(linha \d+, coluna \d+\)/);
    expect(message).not.toMatch(/position|token/i);
  });

  it("omite a posicao quando o erro nao informa nenhuma", () => {
    expect(friendlyJsonError(new Error("algo inesperado"))).toBe(
      "Não foi possível ler o JSON: o conteúdo não está no formato JSON",
    );
  });

  it("aponta o caractere quando a origem nao foi informada", () => {
    expect(friendlyJsonError(new Error("Unexpected token x in JSON at position 4"))).toBe(
      "Não foi possível ler o JSON: há um caractere fora do lugar (caractere 5)",
    );
  });

  it("aceita valores lancados que nao sao Error", () => {
    expect(friendlyJsonError("falha")).toMatch(/^Não foi possível ler o JSON: /);
    expect(friendlyJsonError(undefined)).toMatch(/^Não foi possível ler o JSON: /);
  });
});

describe("formatFieldIssue", () => {
  const item = { type: "input-text", props: { label: "Nome completo" } };

  it("compoe referencia do campo + prop traduzida + mensagem traduzida", () => {
    const parsed = FieldSchema.safeParse({ id: "a", type: "input-text", props: {} });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const message = formatFieldIssue(parsed.error.issues[0], item, 0);
    expect(message).toBe('Campo "Nome completo" (1º) — Identificador: não foi preenchido');
    expect(message).not.toMatch(TECHNICAL);
  });

  it("descreve indices como posicao em vez de caminho JSON", () => {
    const message = formatFieldIssue(
      { path: ["props", "source", 1, "value"], message: "Required" },
      item,
      2,
    );
    expect(message).toBe(
      'Campo "Nome completo" (3º) — Lista de opções → 2º item → Valor: não foi preenchido',
    );
  });

  it("omite a trilha de props quando o issue e do campo inteiro", () => {
    const message = formatFieldIssue({ path: [], message: "Invalid input" }, item, 0);
    expect(message).toBe('Campo "Nome completo" (1º): valor inválido');
  });
});

describe("formatFormIssue / formatFormErrors", () => {
  const payload = {
    schemaVersion: 1,
    formId: "f1",
    createdAt: "2026-09-14T00:00:00Z",
    updatedAt: "2026-09-14T00:00:00Z",
    fields: [
      { id: "a", type: "input-text", class: "", hide: false, colSpan: 6, props: { name: "ok" } },
      {
        id: "b",
        type: "input-text",
        class: "",
        hide: false,
        colSpan: 6,
        props: { label: "Sobrenome" },
      },
    ],
  };

  it("resolve o campo pelo indice do caminho e o referencia pelo rotulo", () => {
    const parsed = FormSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = formatFormErrors(parsed.error.issues, payload);
    expect(errors).toContain('Campo "Sobrenome" (2º) — Identificador: não foi preenchido');
    for (const error of errors) expect(error).not.toMatch(TECHNICAL);
  });

  it("traduz as chaves da raiz do arquivo", () => {
    expect(
      formatFormIssue(
        { path: ["schemaVersion"], message: "Invalid literal value, expected 1" },
        [],
      ),
    ).toBe("Arquivo inválido — Versão do formato: valor não suportado");
    expect(formatFormIssue({ path: ["fields"], message: "Required" }, [])).toBe(
      "Arquivo inválido — Lista de campos: não foi preenchido",
    );
  });

  it("reporta o arquivo inteiro quando o issue nao tem caminho", () => {
    expect(formatFormIssue({ path: [], message: "Expected object, received array" }, [])).toBe(
      "Arquivo inválido: esperado objeto, recebido lista",
    );
  });

  it("tolera payload sem lista de campos", () => {
    const parsed = FormSchema.safeParse("nao e um objeto");
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = formatFormErrors(parsed.error.issues, "nao e um objeto");
    expect(errors.length).toBeGreaterThan(0);
    for (const error of errors) expect(error).not.toMatch(TECHNICAL);
  });
});
