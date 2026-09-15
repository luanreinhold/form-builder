import { describe, expect, it } from "vitest";
import { buildExport, serializeForm, toV3SourceList } from "@/utils/exportForm";
import { parseImport } from "@/utils/importForm";

/** GER-05: nada disso pode aparecer numa mensagem lida por um Consultor. */
const TECHNICAL_PATTERNS = [
  /fields\.\d/, // caminho JSON do payload
  /\bprops\b/, // estrutura interna do campo
  /\bschemaVersion\b|\bformId\b|\bcolSpan\b/, // nomes internos
  /\bExpected\b|\breceived\b|\bRequired\b|Unexpected/, // texto cru do Zod / JSON.parse
];

function expectConsultorFriendly(errors: readonly string[]) {
  expect(errors.length).toBeGreaterThan(0);
  for (const error of errors) {
    for (const pattern of TECHNICAL_PATTERNS) expect(error).not.toMatch(pattern);
  }
}

const sample = {
  schemaVersion: 1 as const,
  formId: "f1",
  createdAt: "2026-06-08T00:00:00Z",
  updatedAt: "2026-06-08T00:00:00Z",
  fields: [
    {
      id: "a",
      type: "input-text" as const,
      class: "",
      hide: false,
      colSpan: 6,
      props: { name: "nome", required: true, max: "45" },
    },
  ],
};

describe("exportForm", () => {
  it("buildExport retorna lista no shape v3 (IFormSourceItem[])", () => {
    const r = buildExport(sample);
    expect(r.ok).toBe(true);
    expect(r.data).toHaveLength(1);
    const item = r.data?.[0] as unknown as Record<string, unknown>;
    expect(item.type).toBe("input-text");
    expect(item).not.toHaveProperty("id");
    expect(item).not.toHaveProperty("colSpan");
  });

  it("gera classe bootstrap a partir do colSpan quando class esta vazia", () => {
    const r = buildExport(sample);
    expect(r.data?.[0]?.class).toBe("d-block mb-2 col-md-6");
  });

  it("mescla classe customizada com o col-md do colSpan", () => {
    const custom = {
      ...sample,
      fields: [{ ...sample.fields[0], class: "d-none" }],
    };
    const r = buildExport(custom);
    expect(r.data?.[0]?.class).toBe("d-none col-md-6");
  });

  it("colSpan prevalece sobre col-md conflitante na classe customizada", () => {
    const custom = {
      ...sample,
      fields: [{ ...sample.fields[0], class: "d-none col-md-8" }],
    };
    const r = buildExport(custom);
    expect(r.data?.[0]?.class).toBe("d-none col-md-6");
  });

  it("omite hide quando false e inclui quando true", () => {
    const r = buildExport(sample);
    expect(r.data?.[0]).not.toHaveProperty("hide");

    const hidden = {
      ...sample,
      fields: [{ ...sample.fields[0], hide: true }],
    };
    const r2 = buildExport(hidden);
    expect(r2.data?.[0]?.hide).toBe(true);
  });

  it("converte min/max numericos para number nas props", () => {
    const r = buildExport(sample);
    expect(r.data?.[0]?.props.max).toBe(45);
    expect(r.data?.[0]?.props.required).toBe(true);
    expect(r.data?.[0]?.props.name).toBe("nome");
  });

  it("buildExport falha em payload invalido", () => {
    const bad = { ...sample, schemaVersion: 99 as unknown as 1 };
    const r = buildExport(bad);
    expect(r.ok).toBe(false);
    expect((r.errors ?? []).length).toBeGreaterThan(0);
  });

  it("serializeForm produz JSON valido do array v3", () => {
    const items = toV3SourceList(sample);
    const s = serializeForm(items);
    const parsed = JSON.parse(s);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].props.name).toBe("nome");
  });

  it("exporta dynamic-select com entity, filters e fields (objeto), sem source", () => {
    const form = {
      ...sample,
      fields: [
        {
          id: "ds",
          type: "dynamic-select" as const,
          class: "d-block mb-2",
          hide: true,
          colSpan: 12,
          props: {
            name: "subMabo",
            label: "Submotivo de Abono",
            entity: "submabo",
            filters: {},
            fields: { key: "atrNomeSubMotivoAbono", value: "atrIdSubMotivoAbono" },
          },
        },
      ],
    };
    const r = buildExport(form);
    expect(r.ok).toBe(true);
    const props = r.data?.[0]?.props as Record<string, unknown>;
    expect(props.entity).toBe("submabo");
    expect(props.filters).toEqual({});
    expect(props.fields).toEqual({
      key: "atrNomeSubMotivoAbono",
      value: "atrIdSubMotivoAbono",
    });
    expect(props).not.toHaveProperty("source");
  });

  it("exporta divider-component sem exigir name (nao e um input)", () => {
    const form = {
      ...sample,
      fields: [
        {
          id: "d",
          type: "divider-component" as const,
          class: "",
          hide: false,
          colSpan: 12,
          props: { label: "Dados Pessoais", transformDivider: "medium" },
        },
      ],
    };
    const r = buildExport(form);
    expect(r.ok).toBe(true);
    const props = r.data?.[0]?.props as Record<string, unknown>;
    expect(props.label).toBe("Dados Pessoais");
    expect(props.transformDivider).toBe("medium");
    expect(props).not.toHaveProperty("name");
  });

  it("falha ao exportar dynamic-select com entity vazio", () => {
    const form = {
      ...sample,
      fields: [
        {
          id: "ds",
          type: "dynamic-select" as const,
          class: "",
          hide: false,
          colSpan: 12,
          props: {
            name: "subMabo",
            entity: "",
            filters: {},
            fields: { key: "k", value: "v" },
          },
        },
      ],
    };
    const r = buildExport(form);
    expect(r.ok).toBe(false);
    expect(r.errors?.[0]).toBe(
      'Campo "subMabo" (1º) — Entidade: não foi preenchida ' +
        '(obrigatória em campos do tipo "Select Dinâmico" para buscar os dados)',
    );
  });

  it("falha ao exportar input-modal com entity vazio", () => {
    const form = {
      ...sample,
      fields: [
        {
          id: "im",
          type: "input-modal" as const,
          class: "",
          hide: false,
          colSpan: 12,
          props: {
            name: "selecao",
            entity: "",
            allowFields: [],
            redirectFields: {},
          },
        },
      ],
    };
    const r = buildExport(form);
    expect(r.ok).toBe(false);
    expect(r.errors?.[0]).toBe(
      'Campo "selecao" (1º) — Entidade: não foi preenchida ' +
        '(obrigatória em campos do tipo "Modal" para buscar os dados)',
    );
  });

  it("exporta input-modal com entity preenchida", () => {
    const form = {
      ...sample,
      fields: [
        {
          id: "im",
          type: "input-modal" as const,
          class: "",
          hide: false,
          colSpan: 12,
          props: {
            name: "selecao",
            entity: "pessoa",
            allowFields: [],
            redirectFields: {},
          },
        },
      ],
    };
    const r = buildExport(form);
    expect(r.ok).toBe(true);
    const props = r.data?.[0]?.props as Record<string, unknown>;
    expect(props.entity).toBe("pessoa");
  });
});

describe("importForm", () => {
  it("parseImport aceita string JSON", () => {
    const r = parseImport(JSON.stringify(sample));
    expect(r.ok).toBe(true);
  });

  it("parseImport aceita objeto", () => {
    const r = parseImport(sample);
    expect(r.ok).toBe(true);
  });

  it("parseImport rejeita JSON malformado com diagnostico em portugues", () => {
    const r = parseImport("{ invalido");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toMatch(/^Não foi possível ler o JSON: /);
    expect(r.errors[0]).not.toMatch(/Unexpected|position|token/i);
  });

  it("parseImport rejeita estrutura invalida", () => {
    const r = parseImport({ foo: "bar" });
    expect(r.ok).toBe(false);
  });

  it("parseImport aceita o formato v3 exportado (round-trip)", () => {
    const exported = buildExport(sample);
    expect(exported.ok).toBe(true);
    const r = parseImport(serializeForm(exported.data ?? []));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.fields).toHaveLength(1);
    const f = r.data.fields[0];
    expect(f.type).toBe("input-text");
    expect(f.id).toBeTruthy();
    expect(f.colSpan).toBe(6); // derivado de col-md-6
    expect(f.class).toBe(""); // classe gerada pelo export volta a vazio
    expect((f.props as { max?: string }).max).toBe("45"); // number -> string
    expect((f.props as { required?: boolean }).required).toBe(true);
  });

  it("parseImport deriva colSpan da classe customizada e remove o token col-md dela", () => {
    const r = parseImport(
      JSON.stringify([{ type: "input-text", class: "d-none col-md-4", props: { name: "x" } }]),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.fields[0].class).toBe("d-none");
    expect(r.data.fields[0].colSpan).toBe(4);
  });

  it("round-trip com classe customizada mantem class e colSpan estaveis", () => {
    const r = parseImport(
      JSON.stringify([{ type: "input-text", class: "d-none col-md-4", props: { name: "x" } }]),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const back = buildExport(r.data);
    expect(back.ok).toBe(true);
    expect(back.data?.[0]?.class).toBe("d-none col-md-4");
  });

  it("parseImport usa colSpan 12 quando a classe nao tem col-md-N", () => {
    const r = parseImport(JSON.stringify([{ type: "input-text", props: { name: "x" } }]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.fields[0].colSpan).toBe(12);
    expect(r.data.fields[0].hide).toBe(false);
  });

  it("parseImport rejeita tipo desconhecido referenciando o campo pela posicao", () => {
    const r = parseImport(
      JSON.stringify([
        { type: "input-text", props: { name: "ok" } },
        { type: "input-foo", props: { name: "x" } },
      ]),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toBe('Campo "x" (2º): tipo de campo não reconhecido ("input-foo")');
  });

  it("parseImport rejeita item v3 sem identificador", () => {
    const r = parseImport(JSON.stringify([{ type: "input-text", props: {} }]));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toBe('Campo do tipo "Texto" (1º) — Identificador: não foi preenchido');
  });

  it("parseImport rejeita item que nao e um objeto", () => {
    const r = parseImport(JSON.stringify([{ type: "input-text", props: { name: "ok" } }, 42]));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toBe("Campo (2º): o conteúdo não descreve um campo do formulário");
  });

  it("importa dynamic-select v3 com redirectFields e preserva props extras (conditions)", () => {
    const v3 = [
      {
        type: "dynamic-select",
        class: "d-block mb-2 col-md-6",
        hide: true,
        props: {
          name: "subMabo",
          entity: "submabo",
          fields: { key: "atrNome", value: "atrId" },
          filters: {},
          redirectFields: { destino: "atrNomePessoa" },
          conditions: [{ field: "tipo", value: 1, operator: "===" }],
        },
      },
    ];
    const r = parseImport(JSON.stringify(v3));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const props = r.data.fields[0].props as Record<string, unknown>;
    expect(props.redirectFields).toEqual({ destino: "atrNomePessoa" });
    expect(props.conditions).toEqual([{ field: "tipo", value: 1, operator: "===" }]);
    expect(r.data.fields[0].hide).toBe(true);
    expect(r.data.fields[0].colSpan).toBe(6);

    // re-export mantem redirectFields e conditions (fidelidade round-trip)
    const back = buildExport(r.data);
    expect(back.ok).toBe(true);
    const exportedProps = back.data?.[0]?.props as Record<string, unknown>;
    expect(exportedProps.redirectFields).toEqual({ destino: "atrNomePessoa" });
    expect(exportedProps.conditions).toEqual([{ field: "tipo", value: 1, operator: "===" }]);
    expect(back.data?.[0]?.hide).toBe(true);
  });

  it("importa divider-component v3 e mantem round-trip fiel", () => {
    const v3 = [
      {
        type: "divider-component",
        class: "d-block mb-2 col-md-12",
        props: { name: "dividerNome", label: "Endereço", transformDivider: "large" },
      },
    ];
    const r = parseImport(JSON.stringify(v3));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const f = r.data.fields[0];
    expect(f.type).toBe("divider-component");
    const props = f.props as Record<string, unknown>;
    expect(props.name).toBe("dividerNome");
    expect(props.label).toBe("Endereço");
    expect(props.transformDivider).toBe("large");

    const back = buildExport(r.data);
    expect(back.ok).toBe(true);
    expect(back.data?.[0]?.props).toEqual(v3[0].props);
  });

  it("importa input-modal v3 com redirectFields e components (passthrough)", () => {
    const v3 = [
      {
        type: "input-modal",
        props: {
          name: "selecao",
          redirectFields: { campo: "atrX" },
          allowFields: ["a", "b"],
          components: { search: { entity: "pessoa" } },
        },
      },
    ];
    const r = parseImport(JSON.stringify(v3));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const props = r.data.fields[0].props as Record<string, unknown>;
    expect(props.redirectFields).toEqual({ campo: "atrX" });
    expect(props.allowFields).toEqual(["a", "b"]);
    expect(props.components).toEqual({ search: { entity: "pessoa" } });
  });
});

// GER-05 do Plano de Testes: as mensagens precisam ser compreensiveis para
// Consultores — sem caminho JSON, sem nomes internos e sempre apontando qual
// campo do formulario esta com problema.
describe("mensagens de erro (GER-05)", () => {
  const semNome = {
    ...sample,
    fields: [{ ...sample.fields[0], props: {} as Record<string, unknown> }],
  };
  const larguraInvalida = {
    ...sample,
    fields: [{ ...sample.fields[0], colSpan: 99 }],
  };

  it("export: erro de validacao referencia o campo pelo rotulo e pela posicao", () => {
    const form = {
      ...sample,
      fields: [
        sample.fields[0],
        { ...sample.fields[0], id: "b", props: { label: "Sobrenome" } as Record<string, unknown> },
      ],
    };
    const r = buildExport(form);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('Campo "Sobrenome" (2º) — Identificador: não foi preenchido');
    expectConsultorFriendly(r.errors ?? []);
  });

  it("export: traduz limites numericos das diretivas base", () => {
    const r = buildExport(larguraInvalida);
    expect(r.ok).toBe(false);
    expect(r.errors).toContain('Campo "nome" (1º) — Largura: deve ser no máximo 12');
    expectConsultorFriendly(r.errors ?? []);
  });

  it("export: erro na raiz do arquivo nao expoe a chave interna", () => {
    const r = buildExport({ ...sample, schemaVersion: 99 as unknown as 1 });
    expect(r.ok).toBe(false);
    expect(r.errors).toContain("Arquivo inválido — Versão do formato: valor não suportado");
    expectConsultorFriendly(r.errors ?? []);
  });

  it("export: entity vazia aponta o campo e o tipo em portugues", () => {
    const form = {
      ...sample,
      fields: [
        sample.fields[0],
        {
          id: "ds",
          type: "dynamic-select" as const,
          class: "",
          hide: false,
          colSpan: 12,
          props: { name: "sub", label: "Submotivo", entity: "", filters: {} },
        },
      ],
    };
    const r = buildExport(form);
    expect(r.ok).toBe(false);
    expect(r.errors?.[0]).toMatch(/^Campo "Submotivo" \(2º\) — Entidade: não foi preenchida/);
    expectConsultorFriendly(r.errors ?? []);
  });

  it("import: lista v3 invalida referencia cada campo pela posicao", () => {
    const r = parseImport(
      JSON.stringify([
        { type: "input-text", props: { name: "ok" } },
        { type: "input-text", props: {} },
        { type: "input-foo", props: { label: "Cidade" } },
      ]),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expectConsultorFriendly(r.errors);
    for (const error of r.errors) expect(error).toMatch(/^Campo .*\(\d+º\)/);
    expect(r.errors).toHaveLength(2);
  });

  it("import: payload interno invalido nao expoe o caminho JSON", () => {
    const r = parseImport(semNome);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toContain('Campo do tipo "Texto" (1º) — Identificador: não foi preenchido');
    expectConsultorFriendly(r.errors);
  });

  it("import: JSON malformado vira diagnostico em portugues", () => {
    const r = parseImport('[{ "type": "input-text", "props": { "name": "x" }]');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors[0]).toMatch(/^Não foi possível ler o JSON: /);
    expectConsultorFriendly(r.errors);
  });
});
