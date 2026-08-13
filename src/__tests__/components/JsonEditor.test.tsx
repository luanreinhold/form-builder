import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JsonEditor } from "@/components/props/editors/JsonEditor";

function setup(value: unknown = undefined) {
  const onChange = vi.fn();
  const utils = render(<JsonEditor label="Filtros" value={value} onChange={onChange} />);
  const textarea = screen.getByRole("textbox", { name: "Filtros" }) as HTMLTextAreaElement;
  return { onChange, textarea, ...utils };
}

describe("JsonEditor", () => {
  describe("estado inicial (safeStringify)", () => {
    it("renderiza label e textarea vazio para value undefined", () => {
      const { textarea } = setup(undefined);
      expect(screen.getByText("Filtros")).toBeInTheDocument();
      expect(textarea.value).toBe("");
    });

    it("renderiza vazio para value null", () => {
      const { textarea } = setup(null);
      expect(textarea.value).toBe("");
    });

    it("exibe string como esta, sem re-serializar", () => {
      const { textarea } = setup('{"a":1}');
      expect(textarea.value).toBe('{"a":1}');
    });

    it("serializa objeto com indentacao de 2 espacos", () => {
      const { textarea } = setup({ chave: "valor" });
      expect(textarea.value).toBe('{\n  "chave": "valor"\n}');
    });

    it("cai para vazio quando o valor nao e serializavel (referencia circular)", () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      const { textarea } = setup(circular);
      expect(textarea.value).toBe("");
    });
  });

  describe("edicao", () => {
    it("JSON valido dispara onChange com o valor parseado e sem erro", () => {
      const { onChange, textarea } = setup();
      fireEvent.change(textarea, { target: { value: '{"ativo": true}' } });
      expect(onChange).toHaveBeenCalledWith({ ativo: true });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(textarea).not.toHaveAttribute("aria-invalid");
    });

    it("JSON invalido exibe erro e nao dispara onChange", () => {
      const { onChange, textarea } = setup();
      fireEvent.change(textarea, { target: { value: "{invalido" } });
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(textarea).toHaveAttribute("aria-invalid", "true");
      expect(textarea).toHaveAttribute("aria-describedby", screen.getByRole("alert").id);
      expect(textarea.className).toContain("border-danger-active");
    });

    it("texto vazio limpa erro e dispara onChange(undefined)", () => {
      const { onChange, textarea } = setup({ a: 1 });
      fireEvent.change(textarea, { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith(undefined);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("texto so com espacos tambem conta como vazio", () => {
      const { onChange, textarea } = setup();
      fireEvent.change(textarea, { target: { value: "   " } });
      expect(onChange).toHaveBeenCalledWith(undefined);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("corrigir o JSON depois de um erro limpa o alerta", () => {
      const { onChange, textarea } = setup();
      fireEvent.change(textarea, { target: { value: "{oops" } });
      expect(screen.getByRole("alert")).toBeInTheDocument();
      fireEvent.change(textarea, { target: { value: '{"ok": 1}' } });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith({ ok: 1 });
      expect(textarea.className).toContain("border-edge-input");
    });

    it("mantem o texto digitado mesmo quando invalido", () => {
      const { textarea } = setup();
      fireEvent.change(textarea, { target: { value: "{parcial" } });
      expect(textarea.value).toBe("{parcial");
    });
  });

  describe("sincronizacao com a prop value", () => {
    it("atualiza o texto quando value muda externamente", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <JsonEditor label="Filtros" value={{ a: 1 }} onChange={onChange} />,
      );
      rerender(<JsonEditor label="Filtros" value={{ b: 2 }} onChange={onChange} />);
      const textarea = screen.getByRole("textbox", { name: "Filtros" }) as HTMLTextAreaElement;
      expect(textarea.value).toBe('{\n  "b": 2\n}');
    });
  });
});
