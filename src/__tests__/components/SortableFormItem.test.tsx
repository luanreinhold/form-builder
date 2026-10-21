import { DndContext } from "@dnd-kit/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CanvasPanel } from "@/components/layout/CanvasPanel";
import { AlertDialogHost } from "@/components/ui/AlertDialog";
import { useDialogStore } from "@/store/dialogStore";
import { useFormStore } from "@/store/formStore";
import { useToastStore } from "@/store/toastStore";

function renderCanvas() {
  render(
    <DndContext>
      <CanvasPanel />
      <AlertDialogHost />
    </DndContext>,
  );
}

function fieldIds() {
  return useFormStore.getState().fields.map((f) => f.id);
}

/** Clica no ✕ do card `index` e devolve o alertdialog aberto. */
function clickRemove(index: number) {
  fireEvent.click(screen.getAllByRole("button", { name: "Remover campo" })[index]);
  return screen.getByRole("alertdialog");
}

describe("SortableFormItem — botao remover (✕)", () => {
  let first: string;
  let second: string;

  beforeEach(() => {
    act(() => {
      useDialogStore.getState().resolve(false);
      useToastStore.getState().clear();
      useFormStore.getState().clearAll();
      first = useFormStore.getState().addField("input-text");
      second = useFormStore.getState().addField("input-email");
    });
  });

  it("abre o dialogo de confirmacao sem remover o campo", () => {
    renderCanvas();
    const dialog = clickRemove(0);
    expect(dialog).toHaveTextContent("Remover campo");
    expect(dialog).toHaveTextContent("Tem certeza que deseja remover este campo?");
    expect(fieldIds()).toEqual([first, second]);
  });

  it("confirmar remove so o campo clicado e mostra o toast de sucesso", async () => {
    renderCanvas();
    const dialog = clickRemove(0);
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar" }));
    });
    expect(fieldIds()).toEqual([second]);
    expect(document.querySelector(`[data-field-id="${first}"]`)).toBeNull();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ description: "Campo removido.", variant: "success" }),
    ]);
  });

  it("confirmar a remocao do campo selecionado limpa a selecao", async () => {
    act(() => useFormStore.getState().selectField(second));
    renderCanvas();
    const dialog = clickRemove(1);
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar" }));
    });
    expect(fieldIds()).toEqual([first]);
    expect(useFormStore.getState().selectedFieldId).toBeNull();
  });

  it("cancelar fecha o dialogo sem remover nem notificar", async () => {
    renderCanvas();
    const dialog = clickRemove(0);
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    });
    expect(fieldIds()).toEqual([first, second]);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
