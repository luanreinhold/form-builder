import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SourceEditor } from "@/components/props/editors/SourceEditor";

type Item = { key: string | number; value: string; selected?: boolean };

function lastCall(onChange: ReturnType<typeof vi.fn>): Item[] {
  return onChange.mock.calls.at(-1)?.[0] as Item[];
}

describe("SourceEditor", () => {
  it("renderiza os itens existentes do value", () => {
    render(
      <SourceEditor
        label="source"
        value={[
          { key: "Código CID", value: "CID", selected: true },
          { key: "Descrição da doença", value: "DESC" },
        ]}
        onChange={vi.fn()}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByDisplayValue("Código CID")).toBeInTheDocument();
    expect(within(items[0]).getByDisplayValue("CID")).toBeInTheDocument();
  });

  it("trata value undefined como lista vazia sem quebrar", () => {
    render(<SourceEditor label="source" value={undefined} onChange={vi.fn()} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("adiciona um item ao preencher rótulo e valor", () => {
    const onChange = vi.fn();
    render(<SourceEditor label="source" value={[]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Novo rótulo"), {
      target: { value: "Código CID" },
    });
    fireEvent.change(screen.getByLabelText("Novo valor"), {
      target: { value: "CID" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(lastCall(onChange)).toEqual([{ key: "Código CID", value: "CID" }]);
  });

  it("copia o rótulo para o valor quando o valor fica vazio", () => {
    const onChange = vi.fn();
    render(<SourceEditor label="source" value={[]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Novo rótulo"), {
      target: { value: "CID" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(lastCall(onChange)).toEqual([{ key: "CID", value: "CID" }]);
  });

  it("inclui selected quando o checkbox de entrada está marcado", () => {
    const onChange = vi.fn();
    render(<SourceEditor label="source" value={[]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Novo rótulo"), {
      target: { value: "Código CID" },
    });
    fireEvent.change(screen.getByLabelText("Novo valor"), {
      target: { value: "CID" },
    });
    fireEvent.click(screen.getByLabelText("Pré-selecionado"));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(lastCall(onChange)).toEqual([{ key: "Código CID", value: "CID", selected: true }]);
  });

  it("não adiciona e mostra erro quando o rótulo está vazio", () => {
    const onChange = vi.fn();
    render(<SourceEditor label="source" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/rótulo/i)).toBeInTheDocument();
  });

  it("não adiciona valor duplicado", () => {
    const onChange = vi.fn();
    render(
      <SourceEditor
        label="source"
        value={[{ key: "Código CID", value: "CID" }]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Novo rótulo"), {
      target: { value: "Outro" },
    });
    fireEvent.change(screen.getByLabelText("Novo valor"), {
      target: { value: "CID" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/duplicad/i)).toBeInTheDocument();
  });

  it("remove um item", () => {
    const onChange = vi.fn();
    render(
      <SourceEditor
        label="source"
        value={[
          { key: "Código CID", value: "CID" },
          { key: "Descrição", value: "DESC" },
        ]}
        onChange={onChange}
      />,
    );
    const items = screen.getAllByRole("listitem");
    fireEvent.click(within(items[0]).getByRole("button", { name: "Remover" }));
    expect(lastCall(onChange)).toEqual([{ key: "Descrição", value: "DESC" }]);
  });

  it("edita o rótulo de um item inline", () => {
    const onChange = vi.fn();
    render(
      <SourceEditor
        label="source"
        value={[{ key: "Código CID", value: "CID" }]}
        onChange={onChange}
      />,
    );
    const item = screen.getAllByRole("listitem")[0];
    fireEvent.change(within(item).getByDisplayValue("Código CID"), {
      target: { value: "Novo rótulo" },
    });
    expect(lastCall(onChange)).toEqual([{ key: "Novo rótulo", value: "CID" }]);
  });

  it("reordena itens com mover para baixo", () => {
    const onChange = vi.fn();
    render(
      <SourceEditor
        label="source"
        value={[
          { key: "A", value: "A" },
          { key: "B", value: "B" },
        ]}
        onChange={onChange}
      />,
    );
    const items = screen.getAllByRole("listitem");
    fireEvent.click(within(items[0]).getByRole("button", { name: "Mover para baixo" }));
    expect(lastCall(onChange)).toEqual([
      { key: "B", value: "B" },
      { key: "A", value: "A" },
    ]);
  });

  it("alterna para o modo JSON e edita o source colado", () => {
    const onChange = vi.fn();
    render(<SourceEditor label="source" value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /json/i }));
    const textarea = screen.getByRole("textbox", { name: /json/i });
    fireEvent.change(textarea, {
      target: { value: '[{"key":"Código CID","value":"CID"}]' },
    });
    expect(lastCall(onChange)).toEqual([{ key: "Código CID", value: "CID" }]);
  });
});
