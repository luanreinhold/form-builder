import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renderiza children e usa type=button por padrao", () => {
    render(<Button>Salvar</Button>);
    const btn = screen.getByRole("button", { name: "Salvar" });
    expect(btn).toHaveAttribute("type", "button");
  });

  it("aplica classes de variante e tamanho", () => {
    render(
      <Button variant="danger-solid" size="sm">
        Excluir
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Excluir" });
    expect(btn.className).toContain("bg-danger-surface");
    expect(btn.className).toContain("text-xs");
  });

  it("encaminha props nativas e dispara onClick", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} aria-pressed="true" disabled>
        Tema
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Tema" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("concatena className do chamador (aditivo)", () => {
    render(<Button className="ml-1">X</Button>);
    expect(screen.getByRole("button", { name: "X" }).className).toContain("ml-1");
  });

  it("encaminha ref para o elemento button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("permite sobrepor o type", () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute("type", "submit");
  });
});
