import { describe, it, expect } from "vitest";
import { buildExport, serializeForm } from "@/utils/exportForm";
import { parseImport } from "@/utils/importForm";

const sample = {
  schemaVersion: 1 as const,
  formId: "f1",
  createdAt: "2026-06-08T00:00:00Z",
  updatedAt: "2026-06-08T00:00:00Z",
  fields: [
    { id: "a", type: "input-text" as const, class: "", hide: false, props: { name: "nome" } },
  ],
};

describe("exportForm", () => {
  it("buildExport valida com sucesso", () => {
    const r = buildExport(sample);
    expect(r.ok).toBe(true);
    expect(r.data?.fields).toHaveLength(1);
  });

  it("buildExport falha em payload invalido", () => {
    const bad = { ...sample, schemaVersion: 99 as unknown as 1 };
    const r = buildExport(bad);
    expect(r.ok).toBe(false);
    expect((r.errors ?? []).length).toBeGreaterThan(0);
  });

  it("serializeForm produz JSON valido", () => {
    const s = serializeForm(sample);
    expect(JSON.parse(s).formId).toBe("f1");
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

  it("round-trip export -> import preserva dados", () => {
    const exported = buildExport(sample);
    expect(exported.ok).toBe(true);
    const serialized = serializeForm(exported.data!);
    const imported = parseImport(serialized);
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.data.formId).toBe(sample.formId);
      expect(imported.data.fields).toHaveLength(1);
    }
  });
});
