import { describe, it, expect, beforeEach } from "vitest";
import { useFormStore } from "@/store/formStore";

const STORAGE_KEY = "form-builder:draft";

describe("persist middleware", () => {
  beforeEach(() => {
    localStorage.clear();
    useFormStore.getState().clearAll();
  });

  it("persiste fields no localStorage apos addField", () => {
    useFormStore.getState().addField("input-text");
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.fields).toHaveLength(1);
  });

  it("clearAll remove chave do localStorage", () => {
    useFormStore.getState().addField("input-text");
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    useFormStore.getState().clearAll();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("storage corrompido nao quebra a app (gravando manualmente)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      '{ "state": { "fields": [{"id":"x","type":"invalido","props":{}}], "formId":"f", "createdAt":"a", "updatedAt":"b" }, "version": 1 }',
    );
    // Nova adicao deve continuar funcionando
    useFormStore.getState().addField("input-text");
    expect(useFormStore.getState().fields.length).toBeGreaterThanOrEqual(1);
  });

  it("persiste colSpan no storage", () => {
    const id = useFormStore.getState().addField("input-text");
    useFormStore.getState().updateFieldMeta(id, { colSpan: 6 });
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.fields[0].colSpan).toBe(6);
  });
});
