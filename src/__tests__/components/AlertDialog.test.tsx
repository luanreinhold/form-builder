import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AlertDialogHost } from "@/components/ui/AlertDialog";
import { confirm, useDialogStore } from "@/store/dialogStore";

beforeEach(() => {
  act(() => useDialogStore.getState().resolve(false));
});

describe("AlertDialogHost", () => {
  it("nao renderiza nada quando fechado", () => {
    render(<AlertDialogHost />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("abre com titulo, descricao e atributos ARIA", () => {
    render(<AlertDialogHost />);
    act(() => {
      void confirm({ title: "Tem certeza?", description: "Acao irreversivel." });
    });
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText("Tem certeza?")).toBeInTheDocument();
    expect(within(dialog).getByText("Acao irreversivel.")).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).toHaveAttribute("aria-describedby");
  });

  it("resolve true ao clicar em confirmar", async () => {
    render(<AlertDialogHost />);
    let result!: Promise<boolean>;
    act(() => {
      result = confirm({ title: "Confirmar?", confirmLabel: "Sim" });
    });
    fireEvent.click(screen.getByRole("button", { name: "Sim" }));
    await expect(result).resolves.toBe(true);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("resolve false ao clicar em cancelar", async () => {
    render(<AlertDialogHost />);
    let result!: Promise<boolean>;
    act(() => {
      result = confirm({ title: "Confirmar?" });
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await expect(result).resolves.toBe(false);
  });

  it("resolve false ao pressionar Escape", async () => {
    render(<AlertDialogHost />);
    let result!: Promise<boolean>;
    act(() => {
      result = confirm({ title: "Confirmar?" });
    });
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    await expect(result).resolves.toBe(false);
  });

  it("Enter no Cancelar (foco inicial) resolve false, nao confirma", async () => {
    const user = userEvent.setup();
    render(<AlertDialogHost />);
    let result!: Promise<boolean>;
    act(() => {
      result = confirm({ title: "Confirmar?" });
    });
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await expect(result).resolves.toBe(false);
  });

  it("Tab move para Confirmar e Enter resolve true", async () => {
    const user = userEvent.setup();
    render(<AlertDialogHost />);
    let result!: Promise<boolean>;
    act(() => {
      result = confirm({ title: "Confirmar?", confirmLabel: "Sim" });
    });
    await user.tab();
    expect(screen.getByRole("button", { name: "Sim" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await expect(result).resolves.toBe(true);
  });

  it("foco inicial vai para o botao cancelar", () => {
    render(<AlertDialogHost />);
    act(() => {
      void confirm({ title: "Confirmar?" });
    });
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });
});
