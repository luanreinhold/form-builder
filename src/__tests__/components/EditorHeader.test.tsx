import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorHeader } from "@/components/props/sections/EditorHeader";
import { AlertDialogHost } from "@/components/ui/AlertDialog";
import { useDialogStore } from "@/store/dialogStore";
import { useToastStore } from "@/store/toastStore";

function renderHeader() {
  const onDelete = vi.fn();
  render(
    <>
      <EditorHeader type="input-text" onDelete={onDelete} />
      <AlertDialogHost />
    </>,
  );
  return { onDelete };
}

/** Abre o dialogo pelo botao do cabecalho e devolve o alertdialog. */
function openDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
  return screen.getByRole("alertdialog");
}

describe("EditorHeader", () => {
  beforeEach(() => {
    act(() => {
      useDialogStore.getState().resolve(false);
      useToastStore.getState().clear();
    });
  });

  it("exibe o tipo em edicao", () => {
    renderHeader();
    expect(screen.getByText("input-text")).toBeInTheDocument();
  });

  it("Excluir abre o dialogo de confirmacao sem remover o campo", () => {
    const { onDelete } = renderHeader();
    const dialog = openDialog();
    expect(dialog).toHaveTextContent("Remover este campo?");
    expect(dialog).toHaveTextContent("Esta ação não pode ser desfeita.");
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("confirmar remove o campo e mostra o toast de sucesso", async () => {
    const { onDelete } = renderHeader();
    const dialog = openDialog();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ description: "Campo removido.", variant: "success" }),
    ]);
  });

  it("cancelar fecha o dialogo sem remover nem notificar", async () => {
    const { onDelete } = renderHeader();
    const dialog = openDialog();
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    });
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
