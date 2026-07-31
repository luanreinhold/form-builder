import { describe, expect, it } from "vitest";
import { BaseInputPropsSchema } from "@/schemas/base.schema";
import { FormSchema } from "@/schemas/form.schema";
import { FieldSchema } from "@/schemas/inputs.schema";

describe("BaseInputPropsSchema", () => {
  it("exige name", () => {
    const r = BaseInputPropsSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("aceita props minimas", () => {
    const r = BaseInputPropsSchema.safeParse({ name: "campo" });
    expect(r.success).toBe(true);
  });

  it("aceita todas props opcionais", () => {
    const r = BaseInputPropsSchema.safeParse({
      name: "campo",
      label: "Label",
      placeholder: "Digite",
      required: true,
      readonly: false,
      hint: "dica",
      min: "0",
      max: "100",
      showCaracterCounter: true,
      highlight: false,
      doNotTranslate: false,
      customRequiredWarning: "Obrigatorio",
      value: "inicial",
      labelClass: "cls",
      requestFocus: false,
      keyboardOptions: { layout: "br" },
    });
    expect(r.success).toBe(true);
  });
});

describe("FieldSchema", () => {
  it("aceita input-text valido", () => {
    const r = FieldSchema.safeParse({
      id: "abc",
      type: "input-text",
      class: "",
      hide: false,
      props: { name: "nome", doNotAllowSpecialCharacters: true },
    });
    expect(r.success).toBe(true);
  });

  it("rejeita tipo desconhecido", () => {
    const r = FieldSchema.safeParse({ id: "a", type: "input-xyz", props: { name: "a" } });
    expect(r.success).toBe(false);
  });

  it("aceita input-money com minValue/maxValue", () => {
    const r = FieldSchema.safeParse({
      id: "m",
      type: "input-money",
      props: { name: "valor", minValue: 0, maxValue: 1000 },
    });
    expect(r.success).toBe(true);
  });

  it("aceita select com source", () => {
    const r = FieldSchema.safeParse({
      id: "s",
      type: "select-multiple",
      props: {
        name: "sel",
        source: [
          { key: 1, value: "A" },
          { key: 2, value: "B" },
        ],
      },
    });
    expect(r.success).toBe(true);
  });

  it("aceita dynamic-select com entity e fields (objeto chave/valor)", () => {
    const r = FieldSchema.safeParse({
      id: "ds",
      type: "dynamic-select",
      props: {
        name: "subMabo",
        label: "Submotivo de Abono",
        entity: "submabo",
        filters: {},
        fields: { key: "atrNomeSubMotivoAbono", value: "atrIdSubMotivoAbono" },
      },
    });
    expect(r.success).toBe(true);
  });

  it("aplica defaults de entity, filters e fields no dynamic-select", () => {
    const r = FieldSchema.safeParse({
      id: "ds",
      type: "dynamic-select",
      props: { name: "subMabo" },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      const props = r.data.props as {
        entity: string;
        filters: unknown;
        fields: unknown;
      };
      expect(props.entity).toBe("");
      expect(props.filters).toEqual({});
      expect(props.fields).toEqual({ key: "", value: "" });
    }
  });

  it("aceita dynamic-select com redirectFields", () => {
    const r = FieldSchema.safeParse({
      id: "ds",
      type: "dynamic-select",
      props: {
        name: "subMabo",
        entity: "submabo",
        redirectFields: { destino: "atrNomePessoa" },
      },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data.props as { redirectFields?: unknown }).redirectFields).toEqual({
        destino: "atrNomePessoa",
      });
    }
  });

  it("preserva props desconhecidas da v3 via passthrough", () => {
    const r = FieldSchema.safeParse({
      id: "ds",
      type: "dynamic-select",
      props: {
        name: "subMabo",
        entity: "submabo",
        conditions: [{ field: "tipo", value: 1, operator: "===" }],
        forceSelection: true,
      },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      const props = r.data.props as Record<string, unknown>;
      expect(props.conditions).toEqual([{ field: "tipo", value: 1, operator: "===" }]);
      expect(props.forceSelection).toBe(true);
    }
  });

  it("rejeita dynamic-select com fields como array", () => {
    const r = FieldSchema.safeParse({
      id: "ds",
      type: "dynamic-select",
      props: {
        name: "subMabo",
        entity: "submabo",
        fields: [{ key: "k", value: "v" }],
      },
    });
    expect(r.success).toBe(false);
  });

  it("rejeita id vazio", () => {
    const r = FieldSchema.safeParse({ id: "", type: "input-text", props: { name: "a" } });
    expect(r.success).toBe(false);
  });

  it("aplica defaults de class e hide", () => {
    const r = FieldSchema.safeParse({ id: "x", type: "input-text", props: { name: "a" } });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.class).toBe("");
      expect(r.data.hide).toBe(false);
    }
  });

  it("aplica default colSpan = 12 quando ausente", () => {
    const r = FieldSchema.safeParse({ id: "x", type: "input-text", props: { name: "a" } });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.colSpan).toBe(12);
    }
  });

  it("aceita colSpan customizado entre 1 e 12", () => {
    const r = FieldSchema.safeParse({
      id: "x",
      type: "input-text",
      colSpan: 6,
      props: { name: "a" },
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.colSpan).toBe(6);
  });

  it("rejeita colSpan fora de 1..12", () => {
    expect(
      FieldSchema.safeParse({ id: "x", type: "input-text", colSpan: 0, props: { name: "a" } })
        .success,
    ).toBe(false);
    expect(
      FieldSchema.safeParse({ id: "x", type: "input-text", colSpan: 13, props: { name: "a" } })
        .success,
    ).toBe(false);
    expect(
      FieldSchema.safeParse({ id: "x", type: "input-text", colSpan: 1.5, props: { name: "a" } })
        .success,
    ).toBe(false);
  });
});

describe("FormSchema", () => {
  it("aceita formulario valido", () => {
    const r = FormSchema.safeParse({
      schemaVersion: 1,
      formId: "f1",
      createdAt: "2026-06-08T10:00:00Z",
      updatedAt: "2026-06-08T10:00:00Z",
      fields: [{ id: "a", type: "input-text", props: { name: "a" } }],
    });
    expect(r.success).toBe(true);
  });

  it("rejeita schemaVersion errado", () => {
    const r = FormSchema.safeParse({
      schemaVersion: 2,
      formId: "f",
      createdAt: "",
      updatedAt: "",
      fields: [],
    });
    expect(r.success).toBe(false);
  });
});
