import { describe, expect, it } from "vitest";
import { buildExport, serializeForm, toV3SourceList } from "@/utils/exportForm";
import { parseImport } from "@/utils/importForm";

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

  it("preserva classe customizada quando definida", () => {
    const custom = {
      ...sample,
      fields: [{ ...sample.fields[0], class: "d-none" }],
    };
    const r = buildExport(custom);
    expect(r.data?.[0]?.class).toBe("d-none");
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
    expect((r.errors ?? []).some((e) => /entity/i.test(e))).toBe(true);
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

  it("parseImport rejeita JSON malformado", () => {
    const r = parseImport("{ invalido");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/JSON invalido/);
  });

  it("parseImport rejeita estrutura invalida", () => {
    const r = parseImport({ foo: "bar" });
    expect(r.ok).toBe(false);
  });

  it("parseImport rejeita o formato v3 exportado (export e one-way)", () => {
    const exported = buildExport(sample);
    expect(exported.ok).toBe(true);
    const r = parseImport(serializeForm(exported.data ?? []));
    expect(r.ok).toBe(false);
  });
});
