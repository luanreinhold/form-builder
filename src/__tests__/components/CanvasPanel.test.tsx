import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CanvasPanel } from "@/components/layout/CanvasPanel";
import { useFormStore } from "@/store/formStore";

function renderWithDnd(ui: React.ReactNode) {
  return render(<DndContext>{ui}</DndContext>);
}

describe("CanvasPanel", () => {
  beforeEach(() => {
    useFormStore.getState().clearAll();
  });

  it("mostra placeholder quando vazio", () => {
    renderWithDnd(<CanvasPanel />);
    expect(screen.getByText(/Arraste inputs aqui/)).toBeInTheDocument();
  });

  it("renderiza fields existentes", () => {
    useFormStore.getState().addField("input-text");
    useFormStore.getState().addField("input-email");
    renderWithDnd(<CanvasPanel />);
    const previews = screen.getAllByRole("textbox", { hidden: true }).filter(() => true);
    expect(previews.length).toBeGreaterThanOrEqual(2);
  });

  it("clicar em campo seleciona no store", () => {
    const id = useFormStore.getState().addField("input-text");
    renderWithDnd(<CanvasPanel />);
    useFormStore.getState().selectField(null);
    const item = screen.getByText("texto", { selector: "label, span, div, *" });
    fireEvent.click(item.closest("div")!);
    expect(useFormStore.getState().selectedFieldId).toBe(id);
  });

  it("container interno usa grid de 12 colunas", () => {
    useFormStore.getState().addField("input-text");
    const { container } = renderWithDnd(<CanvasPanel />);
    const grid = container.querySelector('[data-testid="canvas-grid"]');
    expect(grid).toBeTruthy();
    expect(grid!.className).toMatch(/grid-cols-12/);
  });

  it("item aplica col-span da field", () => {
    const id = useFormStore.getState().addField("input-text");
    useFormStore.getState().updateFieldMeta(id, { colSpan: 6 });
    const { container } = renderWithDnd(<CanvasPanel />);
    const item = container.querySelector(`[data-field-id="${id}"]`);
    expect(item).toBeTruthy();
    expect(item!.className).toMatch(/col-span-6/);
  });

  it("item sem colSpan usa col-span-12 por padrao", () => {
    const id = useFormStore.getState().addField("input-text");
    const { container } = renderWithDnd(<CanvasPanel />);
    const item = container.querySelector(`[data-field-id="${id}"]`);
    expect(item!.className).toMatch(/col-span-12/);
  });
});
