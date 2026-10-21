import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  FiltersEditor,
  isPrimitiveRecord,
  parseFilterValue,
} from "@/components/props/editors/FiltersEditor";

function lastCall(fn: ReturnType<typeof vi.fn>) {
  return fn.mock.calls[fn.mock.calls.length - 1]?.[0];
}

describe("FiltersEditor", () => {
  it("mostra estado vazio quando nao ha filtros", () => {
    render(<FiltersEditor label="filters" value={{}} onChange={vi.fn()} />);
    expect(screen.getByText(/Nenhum filtro/)).toBeInTheDocument();
  });

  it("trata value undefined sem quebrar", () => {
    render(<FiltersEditor label="filters" value={undefined} onChange={vi.fn()} />);
    expect(screen.getByText(/Nenhum filtro/)).toBeInTheDocument();
  });

  it("renderiza pares existentes com um input para chave e outro para valor", () => {
    render(
      <FiltersEditor label="filters" value={{ rowsPerPage: -1, nome: "ana" }} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Identificador do filtro 1")).toHaveValue("rowsPerPage");
    expect(screen.getByLabelText("Valor do filtro 1")).toHaveValue("-1");
    expect(screen.getByLabelText("Identificador do filtro 2")).toHaveValue("nome");
    expect(screen.getByLabelText("Valor do filtro 2")).toHaveValue("ana");
    expect(screen.queryByLabelText(/Tipo do filtro/)).not.toBeInTheDocument();
  });

  it("adiciona uma linha vazia sem emitir chave vazia", () => {
    const onChange = vi.fn();
    render(<FiltersEditor label="filters" value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar filtro" }));
    expect(screen.getByLabelText("Identificador do filtro 1")).toHaveValue("");
    if (onChange.mock.calls.length > 0) expect(lastCall(onChange)).toEqual({});
  });

  it("valor numerico sai como number", () => {
    const onChange = vi.fn();
    render(<FiltersEditor label="filters" value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar filtro" }));
    fireEvent.change(screen.getByLabelText("Identificador do filtro 1"), {
      target: { value: "rowsPerPage" },
    });
    fireEvent.change(screen.getByLabelText("Valor do filtro 1"), { target: { value: "-1" } });
    expect(lastCall(onChange)).toEqual({ rowsPerPage: -1 });
  });

  it("valor nao numerico sai como string", () => {
    const onChange = vi.fn();
    render(<FiltersEditor label="filters" value={{ a: 1 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Valor do filtro 1"), { target: { value: "ana" } });
    expect(lastCall(onChange)).toEqual({ a: "ana" });
  });

  it("monta o dicionario com n itens", () => {
    const onChange = vi.fn();
    render(<FiltersEditor label="filters" value={{ rowsPerPage: -1 }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar filtro" }));
    fireEvent.change(screen.getByLabelText("Identificador do filtro 2"), {
      target: { value: "idCliente" },
    });
    fireEvent.change(screen.getByLabelText("Valor do filtro 2"), { target: { value: "123" } });
    expect(lastCall(onChange)).toEqual({ rowsPerPage: -1, idCliente: 123 });
  });

  it("renomeia a chave preservando o valor", () => {
    const onChange = vi.fn();
    render(<FiltersEditor label="filters" value={{ a: 1 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Identificador do filtro 1"), {
      target: { value: "b" },
    });
    expect(lastCall(onChange)).toEqual({ b: 1 });
  });

  it("remove um filtro", () => {
    const onChange = vi.fn();
    render(<FiltersEditor label="filters" value={{ a: 1, b: "x" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remover filtro 1" }));
    expect(lastCall(onChange)).toEqual({ b: "x" });
  });

  it("identificador duplicado mostra aviso e so a primeira vale", () => {
    const onChange = vi.fn();
    render(<FiltersEditor label="filters" value={{ a: 1, b: 2 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Identificador do filtro 2"), {
      target: { value: "a" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/duplicado/);
    expect(lastCall(onChange)).toEqual({ a: 1 });
  });

  it("nao reseta as linhas quando o pai devolve o mesmo conteudo", () => {
    const onChange = vi.fn();
    const { rerender } = render(<FiltersEditor label="filters" value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar filtro" }));
    rerender(<FiltersEditor label="filters" value={{}} onChange={onChange} />);
    expect(screen.getByLabelText("Identificador do filtro 1")).toBeInTheDocument();
  });

  it("mantem o texto digitado enquanto o valor vira number (ex.: '1.')", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FiltersEditor label="filters" value={{ a: 1 }} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText("Valor do filtro 1"), { target: { value: "1." } });
    rerender(<FiltersEditor label="filters" value={lastCall(onChange)} onChange={onChange} />);
    expect(screen.getByLabelText("Valor do filtro 1")).toHaveValue("1.");
  });

  it("reflete mudanca externa (import/undo)", () => {
    const { rerender } = render(
      <FiltersEditor label="filters" value={{ a: 1 }} onChange={vi.fn()} />,
    );
    rerender(<FiltersEditor label="filters" value={{ z: "novo" }} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Identificador do filtro 1")).toHaveValue("z");
    expect(screen.getByLabelText("Valor do filtro 1")).toHaveValue("novo");
  });
});

describe("parseFilterValue", () => {
  it("converte texto numerico em number", () => {
    expect(parseFilterValue("-1")).toBe(-1);
    expect(parseFilterValue("123")).toBe(123);
    expect(parseFilterValue(" 2.5 ")).toBe(2.5);
  });

  it("mantem o resto como string", () => {
    expect(parseFilterValue("")).toBe("");
    expect(parseFilterValue("   ")).toBe("   ");
    expect(parseFilterValue("-")).toBe("-");
    expect(parseFilterValue("ana")).toBe("ana");
    expect(parseFilterValue("true")).toBe("true");
    expect(parseFilterValue("Infinity")).toBe("Infinity");
  });
});

describe("isPrimitiveRecord", () => {
  it("aceita objeto com string/number e objeto vazio", () => {
    expect(isPrimitiveRecord({})).toBe(true);
    expect(isPrimitiveRecord({ a: 1, b: "x" })).toBe(true);
    expect(isPrimitiveRecord(undefined)).toBe(true);
  });

  it("rejeita booleanos, valores aninhados, arrays e null", () => {
    expect(isPrimitiveRecord({ c: false })).toBe(false);
    expect(isPrimitiveRecord({ a: { b: 1 } })).toBe(false);
    expect(isPrimitiveRecord({ a: [1] })).toBe(false);
    expect(isPrimitiveRecord({ a: null })).toBe(false);
    expect(isPrimitiveRecord([1])).toBe(false);
  });
});
