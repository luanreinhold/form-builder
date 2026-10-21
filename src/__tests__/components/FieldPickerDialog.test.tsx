import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { FieldPickerHost } from "@/components/ui/FieldPickerDialog";
import { pickField, useFieldPickerStore } from "@/store/fieldPickerStore";
import { initialState, useFormStore } from "@/store/formStore";

function seedFields() {
  const store = useFormStore.getState();
  const idA = store.addField("input-text");
  store.updateField(idA, { name: "nomeCliente", label: "Nome" });
  const idB = store.addField("input-number");
  store.updateField(idB, { name: "idCliente", label: "Id" });
  const idC = store.addField("input-modal");
  store.updateField(idC, { name: "selecaoPessoa", label: "Pessoa" });
  return { idA, idB, idC };
}

beforeEach(() => {
  act(() => {
    useFieldPickerStore.getState().resolve(null);
    useFormStore.setState({ ...initialState() });
  });
});

describe("FieldPickerHost", () => {
  it("nao renderiza nada quando fechado", () => {
    render(<FieldPickerHost />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre com titulo, ARIA e lista os campos do formulario", () => {
    seedFields();
    render(<FieldPickerHost />);
    act(() => {
      void pickField({ title: "Selecionar campo" });
    });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText("Selecionar campo")).toBeInTheDocument();
    expect(within(dialog).getByText("nomeCliente")).toBeInTheDocument();
    expect(within(dialog).getByText("idCliente")).toBeInTheDocument();
    expect(within(dialog).getByText("selecaoPessoa")).toBeInTheDocument();
  });

  it("exclui o campo em edicao via excludeFieldId", () => {
    const { idC } = seedFields();
    render(<FieldPickerHost />);
    act(() => {
      void pickField({ excludeFieldId: idC });
    });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("nomeCliente")).toBeInTheDocument();
    expect(within(dialog).queryByText("selecaoPessoa")).not.toBeInTheDocument();
  });

  it("resolve com o name do campo clicado e fecha", async () => {
    seedFields();
    render(<FieldPickerHost />);
    let result!: Promise<string | null>;
    act(() => {
      result = pickField();
    });
    fireEvent.click(screen.getByText("nomeCliente"));
    await expect(result).resolves.toBe("nomeCliente");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("desabilita names em disabledNames", () => {
    seedFields();
    render(<FieldPickerHost />);
    act(() => {
      void pickField({ disabledNames: ["idCliente"] });
    });
    const button = screen.getByText("idCliente").closest("button");
    expect(button).toBeDisabled();
  });

  it("resolve null ao clicar em Cancelar", async () => {
    seedFields();
    render(<FieldPickerHost />);
    let result!: Promise<string | null>;
    act(() => {
      result = pickField();
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await expect(result).resolves.toBeNull();
  });

  it("resolve null ao pressionar Escape", async () => {
    seedFields();
    render(<FieldPickerHost />);
    let result!: Promise<string | null>;
    act(() => {
      result = pickField();
    });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await expect(result).resolves.toBeNull();
  });

  it("filtra os campos pela busca (name, label ou tipo)", () => {
    seedFields();
    render(<FieldPickerHost />);
    act(() => {
      void pickField();
    });
    fireEvent.change(screen.getByLabelText("Buscar campo"), { target: { value: "idCli" } });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("idCliente")).toBeInTheDocument();
    expect(within(dialog).queryByText("nomeCliente")).not.toBeInTheDocument();
  });

  it("mostra estado vazio quando o formulario nao tem outros campos", () => {
    render(<FieldPickerHost />);
    act(() => {
      void pickField();
    });
    expect(screen.getByText("Nenhum outro campo no formulário.")).toBeInTheDocument();
  });
});
