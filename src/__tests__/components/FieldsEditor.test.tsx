import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FieldsEditor } from "@/components/props/editors/FieldsEditor";

describe("FieldsEditor", () => {
  it("renderiza key e value do value atual", () => {
    render(
      <FieldsEditor label="fields" value={{ key: "atrNome", value: "atrId" }} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("key")).toHaveValue("atrNome");
    expect(screen.getByLabelText("value")).toHaveValue("atrId");
  });

  it("trata value undefined sem quebrar (inputs vazios)", () => {
    render(<FieldsEditor label="fields" value={undefined} onChange={vi.fn()} />);
    expect(screen.getByLabelText("key")).toHaveValue("");
    expect(screen.getByLabelText("value")).toHaveValue("");
  });

  it("emite objeto { key, value } ao editar key", () => {
    const onChange = vi.fn();
    render(<FieldsEditor label="fields" value={{ key: "", value: "atrId" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("key"), { target: { value: "atrNome" } });
    expect(onChange).toHaveBeenLastCalledWith({ key: "atrNome", value: "atrId" });
  });

  it("emite objeto { key, value } ao editar value", () => {
    const onChange = vi.fn();
    render(
      <FieldsEditor label="fields" value={{ key: "atrNome", value: "" }} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText("value"), { target: { value: "atrId" } });
    expect(onChange).toHaveBeenLastCalledWith({ key: "atrNome", value: "atrId" });
  });
});
