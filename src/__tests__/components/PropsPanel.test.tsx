import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PropsPanel } from "@/components/layout/PropsPanel";
import { useFormStore } from "@/store/formStore";

describe("PropsPanel", () => {
  beforeEach(() => {
    useFormStore.getState().clearAll();
  });

  it("mostra mensagem quando nenhum campo selecionado", () => {
    render(<PropsPanel />);
    expect(screen.getByText(/Selecione um campo/)).toBeInTheDocument();
  });

  it("editar label atualiza o store", async () => {
    const id = useFormStore.getState().addField("input-text");
    render(<PropsPanel />);
    const labelInput = screen
      .getAllByDisplayValue("texto")
      .find((el) => (el as HTMLInputElement).type === "text") as HTMLInputElement;
    expect(labelInput).toBeTruthy();
    await userEvent.clear(labelInput);
    await userEvent.type(labelInput, "Nome Completo");
    const props = useFormStore.getState().fields.find((f) => f.id === id)?.props as Record<
      string,
      unknown
    >;
    expect(props.name).toBe("Nome Completo");
  });

  it("toggle required altera o store", () => {
    const id = useFormStore.getState().addField("input-text");
    render(<PropsPanel />);
    const checkbox = screen.getByLabelText("required") as HTMLInputElement;
    fireEvent.click(checkbox);
    const props = useFormStore.getState().fields.find((f) => f.id === id)?.props as Record<
      string,
      unknown
    >;
    expect(props.required).toBe(true);
  });
});
