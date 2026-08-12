import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DraggableInput } from "@/components/dnd/DraggableInput";
import { Icon } from "@/components/icons/Icon";
import { REGISTRY } from "@/components/inputs/registry";

describe("Icon", () => {
  it("renderiza svg decorativo com aria-hidden", () => {
    const { container } = render(<Icon name="x" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("repassa props como width e className", () => {
    const { container } = render(
      <Icon name="trash" width={16} height={16} className="text-red-500" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
    expect(svg).toHaveClass("text-red-500");
  });
});

describe("DraggableInput com icone de categoria", () => {
  it("renderiza o icone junto do label", () => {
    render(
      <DndContext>
        <DraggableInput entry={REGISTRY["input-text"]} />
      </DndContext>,
    );
    const btn = screen.getByRole("button", { name: /Texto/ });
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });
});
