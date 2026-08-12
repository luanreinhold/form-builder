import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StringEditor } from "@/components/props/editors/StringEditor";

describe("StringEditor", () => {
  it("sem erro: input valido e nenhum alert", () => {
    render(<StringEditor label="name" value="x" onChange={vi.fn()} />);
    expect(screen.getByLabelText("name")).toBeValid();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("com erro: marca aria-invalid e associa a mensagem ao input", () => {
    render(
      <StringEditor label="name" value="" onChange={vi.fn()} required error="name é obrigatório" />,
    );
    const input = screen.getByLabelText(/name/);
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("name é obrigatório");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
