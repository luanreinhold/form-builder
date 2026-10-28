import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FieldsEditor } from "@/components/props/editors/FieldsEditor";

describe("FieldsEditor", () => {
  it("renderiza key e value do value atual", () => {
    render(
      <FieldsEditor label="fields" value={{ key: "nome", value: "codigo" }} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Identificador")).toHaveValue("nome");
    expect(screen.getByLabelText("Valor")).toHaveValue("codigo");
  });

  it("trata value undefined sem quebrar (inputs vazios)", () => {
    render(<FieldsEditor label="fields" value={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Identificador")).toHaveValue("");
    expect(screen.getByLabelText("Valor")).toHaveValue("");
  });

  it("emite objeto { key, value } ao editar key", () => {
    const onChange = vi.fn();
    render(
      <FieldsEditor label="fields" value={{ key: "", value: "codigo" }} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText("Identificador"), { target: { value: "nome" } });
    expect(onChange).toHaveBeenLastCalledWith({ key: "nome", value: "codigo" });
  });

  it("emite objeto { key, value } ao editar value", () => {
    const onChange = vi.fn();
    render(<FieldsEditor label="fields" value={{ key: "nome", value: "" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "codigo" } });
    expect(onChange).toHaveBeenLastCalledWith({ key: "nome", value: "codigo" });
  });
});
