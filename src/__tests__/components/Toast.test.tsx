import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastHost } from "@/components/ui/Toast";
import { DEFAULT_TOAST_DURATION, toast, useToastStore } from "@/store/toastStore";

/** Avanca os timers falsos dentro de act para o React processar o dismiss. */
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Dispara um toast fora do render, como faria um handler de botao. */
function push(...args: Parameters<typeof toast>) {
  let id = "";
  act(() => {
    id = toast(...args);
  });
  return id;
}

beforeEach(() => {
  vi.useFakeTimers();
  useToastStore.getState().clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastHost", () => {
  it("nao renderiza nada com a fila vazia", () => {
    render(<ToastHost />);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Notificações" })).not.toBeInTheDocument();
  });

  it("renderiza titulo e descricao dentro da regiao de notificacoes", () => {
    render(<ToastHost />);
    push({ title: "Exportado", description: "JSON copiado." });
    expect(screen.getByRole("region", { name: "Notificações" })).toBeInTheDocument();
    expect(screen.getByText("Exportado")).toBeInTheDocument();
    expect(screen.getByText("JSON copiado.")).toBeInTheDocument();
  });

  it("renderiza toast sem titulo (so descricao)", () => {
    render(<ToastHost />);
    push({ description: "Somente a mensagem." });
    const item = screen.getByTestId("toast");
    // aria-atomic garante que a live region anuncie o conteudo inteiro.
    expect(item).toHaveAttribute("aria-atomic", "true");
    expect(item).toHaveTextContent("Somente a mensagem.");
  });

  it("empilha varios toasts simultaneos", () => {
    render(<ToastHost />);
    push({ description: "Primeiro" });
    push({ description: "Segundo" });
    expect(screen.getAllByTestId("toast")).toHaveLength(2);
  });

  it.each([
    ["info", "status", "polite"],
    ["success", "status", "polite"],
    ["warning", "alert", "assertive"],
    ["danger", "alert", "assertive"],
  ] as const)("variante %s usa role=%s e aria-live=%s", (variant, role, live) => {
    render(<ToastHost />);
    push({ description: "Mensagem", variant });
    const item = screen.getByTestId("toast");
    expect(item).toHaveAttribute("role", role);
    expect(item).toHaveAttribute("aria-live", live);
    expect(item).toHaveAttribute("data-variant", variant);
  });

  it("usa a variante info por padrao", () => {
    render(<ToastHost />);
    push({ description: "Mensagem" });
    expect(screen.getByTestId("toast")).toHaveAttribute("data-variant", "info");
  });

  it("fecha ao clicar no botao fechar", () => {
    render(<ToastHost />);
    push({ description: "Mensagem" });
    fireEvent.click(screen.getByRole("button", { name: "Fechar notificação" }));
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("fecha sozinho apos a duracao padrao", () => {
    render(<ToastHost />);
    push({ description: "Mensagem" });
    advance(DEFAULT_TOAST_DURATION - 1);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    advance(2);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("respeita a duracao informada", () => {
    render(<ToastHost />);
    push({ description: "Mensagem", duration: 1000 });
    advance(999);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    advance(2);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("duration 0 mantem o toast ate o clique", () => {
    render(<ToastHost />);
    push({ description: "Erro persistente", variant: "danger", duration: 0 });
    advance(DEFAULT_TOAST_DURATION * 4);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar notificação" }));
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("pausa no hover e retoma do tempo restante ao sair", () => {
    render(<ToastHost />);
    push({ description: "Mensagem", duration: 1000 });
    const item = screen.getByTestId("toast");

    advance(500);
    fireEvent.mouseEnter(item);
    advance(5000);
    expect(screen.getByTestId("toast")).toBeInTheDocument();

    fireEvent.mouseLeave(item);
    advance(400);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    advance(200);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("pausa ao receber foco e retoma no blur", () => {
    render(<ToastHost />);
    push({ description: "Mensagem", duration: 1000 });
    const closeBtn = screen.getByRole("button", { name: "Fechar notificação" });

    fireEvent.focus(closeBtn);
    advance(5000);
    expect(screen.getByTestId("toast")).toBeInTheDocument();

    fireEvent.blur(closeBtn);
    advance(1001);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("fecha apenas o toast clicado, mantendo os demais", () => {
    render(<ToastHost />);
    push({ description: "Primeiro", duration: 0 });
    push({ description: "Segundo", duration: 0 });
    fireEvent.click(screen.getAllByRole("button", { name: "Fechar notificação" })[0]);
    expect(screen.getAllByTestId("toast")).toHaveLength(1);
    expect(screen.getByText("Segundo")).toBeInTheDocument();
  });

  it("nao encurta o timer sob StrictMode (efeito montado duas vezes)", () => {
    render(
      <StrictMode>
        <ToastHost />
      </StrictMode>,
    );
    push({ description: "Mensagem", duration: 1000 });
    advance(999);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    advance(2);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });
});
