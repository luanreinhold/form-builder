import { describe, it, expect, beforeEach } from "vitest";
import { useFormStore } from "@/store/formStore";

function reset() {
  useFormStore.getState().clearAll();
}

describe("formStore", () => {
  beforeEach(() => {
    reset();
  });

  it("addField cria field com defaults e seleciona", () => {
    const id = useFormStore.getState().addField("input-text");
    const s = useFormStore.getState();
    expect(s.fields).toHaveLength(1);
    expect(s.fields[0].id).toBe(id);
    expect(s.fields[0].type).toBe("input-text");
    expect((s.fields[0].props as Record<string, unknown>).name).toBe("texto");
    expect(s.selectedFieldId).toBe(id);
  });

  it("addField insere em indice quando fornecido", () => {
    const a = useFormStore.getState().addField("input-text");
    const b = useFormStore.getState().addField("input-email");
    const c = useFormStore.getState().addField("input-cpf", 1);
    const ids = useFormStore.getState().fields.map((f) => f.id);
    expect(ids).toEqual([a, c, b]);
  });

  it("removeField remove e limpa selecao", () => {
    const id = useFormStore.getState().addField("input-text");
    useFormStore.getState().removeField(id);
    expect(useFormStore.getState().fields).toHaveLength(0);
    expect(useFormStore.getState().selectedFieldId).toBeNull();
  });

  it("updateField faz merge de props", () => {
    const id = useFormStore.getState().addField("input-text");
    useFormStore.getState().updateField(id, { label: "Novo" });
    const props = useFormStore.getState().fields[0].props as Record<string, unknown>;
    expect(props.label).toBe("Novo");
    expect(props.name).toBe("texto");
  });

  it("updateFieldMeta atualiza class e hide", () => {
    const id = useFormStore.getState().addField("input-text");
    useFormStore.getState().updateFieldMeta(id, { class: "col-6", hide: true });
    const f = useFormStore.getState().fields[0];
    expect(f.class).toBe("col-6");
    expect(f.hide).toBe(true);
  });

  it("addField cria field com colSpan default 12", () => {
    useFormStore.getState().addField("input-text");
    expect(useFormStore.getState().fields[0].colSpan).toBe(12);
  });

  it("updateFieldMeta atualiza colSpan", () => {
    const id = useFormStore.getState().addField("input-text");
    useFormStore.getState().updateFieldMeta(id, { colSpan: 6 });
    expect(useFormStore.getState().fields[0].colSpan).toBe(6);
  });

  it("reorderByIndex move o item", () => {
    const a = useFormStore.getState().addField("input-text");
    const b = useFormStore.getState().addField("input-email");
    const c = useFormStore.getState().addField("input-cpf");
    useFormStore.getState().reorderByIndex(2, 0);
    const ids = useFormStore.getState().fields.map((f) => f.id);
    expect(ids).toEqual([c, a, b]);
  });

  it("reorderByIndex no-op em indices iguais", () => {
    const a = useFormStore.getState().addField("input-text");
    const b = useFormStore.getState().addField("input-email");
    useFormStore.getState().reorderByIndex(0, 0);
    expect(useFormStore.getState().fields.map((f) => f.id)).toEqual([a, b]);
  });

  it("reorderFields por id", () => {
    const a = useFormStore.getState().addField("input-text");
    const b = useFormStore.getState().addField("input-email");
    useFormStore.getState().reorderFields(a, b);
    const ids = useFormStore.getState().fields.map((f) => f.id);
    expect(ids).toEqual([b, a]);
  });

  it("selectField muda selecao", () => {
    const id = useFormStore.getState().addField("input-text");
    useFormStore.getState().selectField(null);
    expect(useFormStore.getState().selectedFieldId).toBeNull();
    useFormStore.getState().selectField(id);
    expect(useFormStore.getState().selectedFieldId).toBe(id);
  });

  it("clearAll zera tudo", () => {
    useFormStore.getState().addField("input-text");
    useFormStore.getState().clearAll();
    expect(useFormStore.getState().fields).toHaveLength(0);
    expect(useFormStore.getState().selectedFieldId).toBeNull();
  });

  it("exportJSON produz FormPayload valido", () => {
    useFormStore.getState().addField("input-text");
    const payload = useFormStore.getState().exportJSON();
    expect(payload.schemaVersion).toBe(1);
    expect(payload.fields).toHaveLength(1);
    expect(payload.formId).toBeTruthy();
  });

  it("importJSON valido substitui estado", () => {
    const r = useFormStore.getState().importJSON({
      schemaVersion: 1,
      formId: "imp",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      fields: [{ id: "x", type: "input-text", class: "", hide: false, props: { name: "a" } }],
    });
    expect(r.ok).toBe(true);
    expect(useFormStore.getState().formId).toBe("imp");
    expect(useFormStore.getState().fields).toHaveLength(1);
  });

  it("importJSON invalido retorna erros", () => {
    const r = useFormStore.getState().importJSON({ foo: "bar" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
  });
});
