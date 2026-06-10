import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toolbar } from "@/components/layout/Toolbar";
import { useFormStore } from "@/store/formStore";

beforeEach(() => {
  useFormStore.getState().clearAll();
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn(),
  } as unknown as typeof URL);
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe("Toolbar", () => {
  it("renderiza botoes principais", () => {
    render(<Toolbar />);
    expect(screen.getByText("Importar")).toBeInTheDocument();
    expect(screen.getByText("Exportar JSON")).toBeInTheDocument();
    expect(screen.getByText("Limpar")).toBeInTheDocument();
  });

  it("abre painel de import", () => {
    render(<Toolbar />);
    fireEvent.click(screen.getByText("Importar"));
    expect(screen.getByPlaceholderText(/Cole o JSON aqui/)).toBeInTheDocument();
  });

  it("limpar reseta o store", () => {
    useFormStore.getState().addField("input-text");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<Toolbar />);
    fireEvent.click(screen.getByText("Limpar"));
    expect(useFormStore.getState().fields).toHaveLength(0);
  });

  it("exporta dispara download via Blob URL", async () => {
    useFormStore.getState().addField("input-text");
    const createSpy = vi.spyOn(URL, "createObjectURL");
    render(<Toolbar />);
    fireEvent.click(screen.getByText("Exportar JSON"));
    await waitFor(() => expect(createSpy).toHaveBeenCalled());
  });

  it("importa JSON valido atraves do textarea", () => {
    const sample = {
      schemaVersion: 1,
      formId: "imp",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      fields: [{ id: "x", type: "input-text", class: "", hide: false, props: { name: "n" } }],
    };
    render(<Toolbar />);
    fireEvent.click(screen.getByText("Importar"));
    const ta = screen.getByPlaceholderText(/Cole o JSON aqui/) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: JSON.stringify(sample) } });
    // segundo botao Importar (dentro do painel)
    const importBtns = screen.getAllByText("Importar");
    fireEvent.click(importBtns[importBtns.length - 1]);
    expect(useFormStore.getState().formId).toBe("imp");
  });

  it("importa JSON invalido mostra erro", () => {
    render(<Toolbar />);
    fireEvent.click(screen.getByText("Importar"));
    const ta = screen.getByPlaceholderText(/Cole o JSON aqui/) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "{bad json" } });
    const importBtns = screen.getAllByText("Importar");
    fireEvent.click(importBtns[importBtns.length - 1]);
    expect(screen.getByText(/JSON invalido/)).toBeInTheDocument();
  });
});
