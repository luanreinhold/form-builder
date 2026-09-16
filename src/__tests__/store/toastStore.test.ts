import { beforeEach, describe, expect, it } from "vitest";
import { MAX_TOASTS, toast, useToastStore } from "@/store/toastStore";

beforeEach(() => {
  useToastStore.getState().clear();
});

describe("toastStore", () => {
  it("comeca vazio", () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("push adiciona o toast e devolve o id gerado", () => {
    const id = useToastStore.getState().push({ description: "Salvo" });
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].description).toBe("Salvo");
  });

  it("preserva title, variant e duration informados", () => {
    toast({ title: "Erro", description: "Falhou", variant: "danger", duration: 0 });
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      title: "Erro",
      description: "Falhou",
      variant: "danger",
      duration: 0,
    });
  });

  it("gera ids distintos para toasts iguais", () => {
    const a = toast({ description: "Mesma mensagem" });
    const b = toast({ description: "Mesma mensagem" });
    expect(a).not.toBe(b);
  });

  it("mantem a ordem de chegada (mais antigo primeiro)", () => {
    toast({ description: "Primeiro" });
    toast({ description: "Segundo" });
    expect(useToastStore.getState().toasts.map((t) => t.description)).toEqual([
      "Primeiro",
      "Segundo",
    ]);
  });

  it(`descarta o mais antigo acima de ${MAX_TOASTS} toasts`, () => {
    for (let i = 1; i <= MAX_TOASTS + 2; i++) toast({ description: `Toast ${i}` });
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(MAX_TOASTS);
    expect(toasts[0].description).toBe("Toast 3");
    expect(toasts[MAX_TOASTS - 1].description).toBe(`Toast ${MAX_TOASTS + 2}`);
  });

  it("dismiss remove apenas o toast do id informado", () => {
    const first = toast({ description: "Primeiro" });
    toast({ description: "Segundo" });
    useToastStore.getState().dismiss(first);
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].description).toBe("Segundo");
  });

  it("dismiss com id inexistente nao altera a fila", () => {
    toast({ description: "Primeiro" });
    useToastStore.getState().dismiss("id-que-nao-existe");
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it("clear esvazia a fila", () => {
    toast({ description: "Primeiro" });
    toast({ description: "Segundo" });
    useToastStore.getState().clear();
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
