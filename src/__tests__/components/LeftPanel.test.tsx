import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeftPanel } from "@/components/layout/LeftPanel";

function renderPanel() {
  return render(
    <DndContext>
      <LeftPanel />
    </DndContext>,
  );
}

describe("LeftPanel", () => {
  it("exibe o label da categoria, nunca o id", () => {
    renderPanel();
    expect(screen.getByText("Seleção")).toBeInTheDocument();
    expect(screen.queryByText("selecao")).not.toBeInTheDocument();
  });

  it("mantem a ordem declarada das secoes", () => {
    renderPanel();
    const titulos = screen.getAllByRole("button", { expanded: true }).map((b) => b.textContent);
    expect(titulos[0]).toMatch(/Texto/);
    expect(titulos.at(-1)).toMatch(/Seleção/);
  });
});
