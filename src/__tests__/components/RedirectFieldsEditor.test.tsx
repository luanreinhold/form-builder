import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RedirectFieldsEditor } from "@/components/props/editors/RedirectFieldsEditor";
import { FieldPickerHost } from "@/components/ui/FieldPickerDialog";
import { useFieldPickerStore } from "@/store/fieldPickerStore";
import { initialState, useFormStore } from "@/store/formStore";

function seedFields() {
  const store = useFormStore.getState();
  const idA = store.addField("input-text");
  store.updateField(idA, { name: "atrNomePessoa1", label: "Nome" });
  const idB = store.addField("input-number");
  store.updateField(idB, { name: "searchInitiator", label: "Iniciador" });
  const idModal = store.addField("input-modal");
  store.updateField(idModal, { name: "selecaoPessoa", label: "Pessoa" });
  return { idA, idB, idModal };
}

beforeEach(() => {
  act(() => {
    useFieldPickerStore.getState().resolve(null);
    useFormStore.setState({ ...initialState() });
  });
});

describe("RedirectFieldsEditor", () => {
  it("mostra estado vazio quando nao ha redirecionamentos", () => {
    render(<RedirectFieldsEditor label="redirectFields" value={{}} onChange={vi.fn()} />);
    expect(screen.getByText(/Nenhum redirecionamento/)).toBeInTheDocument();
  });

  it("trata value undefined sem quebrar", () => {
    render(<RedirectFieldsEditor label="redirectFields" value={undefined} onChange={vi.fn()} />);
    expect(screen.getByText(/Nenhum redirecionamento/)).toBeInTheDocument();
  });

  it("renderiza pares chave -> propriedade do item", () => {
    seedFields();
    render(
      <RedirectFieldsEditor
        label="redirectFields"
        value={{ atrNomePessoa1: "atrNomePessoa" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("atrNomePessoa1")).toBeInTheDocument();
    expect(screen.getByLabelText("Propriedade do item para atrNomePessoa1")).toHaveValue(
      "atrNomePessoa",
    );
  });

  it("nao exibe aviso quando a chave corresponde a um campo existente", () => {
    seedFields();
    render(
      <RedirectFieldsEditor
        label="redirectFields"
        value={{ atrNomePessoa1: "atrNomePessoa" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exibe aviso de chave orfa quando o campo nao existe no formulario", () => {
    seedFields();
    render(
      <RedirectFieldsEditor
        label="redirectFields"
        value={{ campoRenomeado: "atrNomePessoa" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      'Campo "campoRenomeado" nao existe no formulario',
    );
  });

  it("emite onChange ao editar a propriedade do item", () => {
    seedFields();
    const onChange = vi.fn();
    render(
      <RedirectFieldsEditor
        label="redirectFields"
        value={{ atrNomePessoa1: "" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Propriedade do item para atrNomePessoa1"), {
      target: { value: "atrNomePessoa" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ atrNomePessoa1: "atrNomePessoa" });
  });

  it("emite onChange sem a chave ao remover", () => {
    seedFields();
    const onChange = vi.fn();
    render(
      <RedirectFieldsEditor
        label="redirectFields"
        value={{ atrNomePessoa1: "atrNomePessoa", searchInitiator: "atrIdPessoa" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remover redirecionamento atrNomePessoa1" }),
    );
    expect(onChange).toHaveBeenLastCalledWith({ searchInitiator: "atrIdPessoa" });
  });

  it("adiciona redirecionamento selecionando o campo no picker", async () => {
    const { idModal } = seedFields();
    const onChange = vi.fn();
    render(
      <>
        <RedirectFieldsEditor
          label="redirectFields"
          value={{}}
          onChange={onChange}
          fieldId={idModal}
        />
        <FieldPickerHost />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Adicionar redirecionamento" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // O proprio input-modal em edicao nao aparece na lista
    expect(screen.queryByText("selecaoPessoa")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("atrNomePessoa1"));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ atrNomePessoa1: "" }));
  });

  it("troca a chave de um par existente preservando o valor", async () => {
    const { idModal } = seedFields();
    const onChange = vi.fn();
    render(
      <>
        <RedirectFieldsEditor
          label="redirectFields"
          value={{ atrNomePessoa1: "atrNomePessoa" }}
          onChange={onChange}
          fieldId={idModal}
        />
        <FieldPickerHost />
      </>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Alterar campo de destino atrNomePessoa1" }),
    );
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByText("searchInitiator"));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({ searchInitiator: "atrNomePessoa" }),
    );
  });

  it("chaves ja usadas aparecem desabilitadas no picker ao adicionar", async () => {
    const { idModal } = seedFields();
    render(
      <>
        <RedirectFieldsEditor
          label="redirectFields"
          value={{ atrNomePessoa1: "atrNomePessoa" }}
          onChange={vi.fn()}
          fieldId={idModal}
        />
        <FieldPickerHost />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Adicionar redirecionamento" }));
    const dialog = await screen.findByRole("dialog");
    const usedButton = screen
      .getAllByText("atrNomePessoa1")
      .map((el) => el.closest("button"))
      .find((btn) => dialog.contains(btn));
    expect(usedButton).toBeDisabled();
  });
});
