import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { useFormStore } from "@/store/formStore";

/**
 * Integracao do DndContext do AppShell com o PointerSensor real do dnd-kit.
 * jsdom nao faz layout: getBoundingClientRect e simulado com um layout fixo
 * (paleta a esquerda, canvas a direita, cards empilhados na ordem do DOM) para
 * que a deteccao de colisao (pointerWithin) encontre os alvos.
 */

const CANVAS = { left: 300, top: 0, width: 600, height: 1000 };
const CARD_HEIGHT = 80;
const CARD_STEP = 100;

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function fakeLayout(this: Element): DOMRect {
  if (this.getAttribute("data-testid") === "canvas-drop-area") {
    return rect(CANVAS.left, CANVAS.top, CANVAS.width, CANVAS.height);
  }
  if (this.hasAttribute("data-field-id")) {
    const cards = Array.from(document.querySelectorAll("[data-field-id]"));
    const index = cards.indexOf(this);
    return rect(CANVAS.left + 20, 20 + index * CARD_STEP, CANVAS.width - 40, CARD_HEIGHT);
  }
  if (this.closest("aside") && this.tagName === "BUTTON") {
    return rect(0, 0, 200, 36);
  }
  return rect(0, 0, 0, 0);
}

/** Centro do card na posicao `index` do canvas. */
function cardCenter(index: number) {
  return { clientX: CANVAS.left + CANVAS.width / 2, clientY: 20 + index * CARD_STEP + 40 };
}

/** Area vazia do canvas, abaixo de qualquer card. */
const EMPTY_CANVAS_POINT = { clientX: CANVAS.left + CANVAS.width / 2, clientY: 950 };

// jsdom nao implementa PointerEvent; o PointerSensor exige isPrimary/button.
class FakePointerEvent extends MouseEvent {
  isPrimary: boolean;
  pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.isPrimary = init.isPrimary ?? true;
    this.pointerId = init.pointerId ?? 1;
  }
}

function drag(source: Element, to: { clientX: number; clientY: number }) {
  const start = source.getBoundingClientRect();
  const from = { clientX: start.left + 5, clientY: start.top + 5 };
  fireEvent.pointerDown(source, { ...from, button: 0, isPrimary: true });
  // Supera o activationConstraint (distance: 5) antes de ir ao alvo.
  fireEvent.pointerMove(document, { clientX: from.clientX + 10, clientY: from.clientY + 10 });
  fireEvent.pointerMove(document, to);
  return {
    // A DragOverlay roda a animacao de drop de forma assincrona apos o pointerup.
    drop: () =>
      act(async () => {
        fireEvent.pointerUp(document, to);
      }),
  };
}

function paletteItem(label: string) {
  return screen.getByRole("button", { name: label });
}

function dragHandles() {
  return screen.getAllByRole("button", { name: "Arrastar campo" });
}

function fieldTypes() {
  return useFormStore.getState().fields.map((f) => f.type);
}

describe("AppShell (drag and drop)", () => {
  const originalPointerEvent = window.PointerEvent;

  beforeEach(() => {
    window.PointerEvent = FakePointerEvent as unknown as typeof PointerEvent;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(fakeLayout);
    act(() => useFormStore.getState().clearAll());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.PointerEvent = originalPointerEvent;
  });

  it("arrastar da paleta para o canvas vazio adiciona o campo", async () => {
    render(<App />);
    await drag(paletteItem("CPF"), EMPTY_CANVAS_POINT).drop();
    expect(fieldTypes()).toEqual(["input-cpf"]);
  });

  it("drop da paleta na area vazia de um canvas com campos adiciona ao final", async () => {
    act(() => {
      useFormStore.getState().addField("input-text");
    });
    render(<App />);
    await drag(paletteItem("CPF"), EMPTY_CANVAS_POINT).drop();
    expect(fieldTypes()).toEqual(["input-text", "input-cpf"]);
  });

  it("drop da paleta sobre um campo insere na posicao dele", async () => {
    act(() => {
      useFormStore.getState().addField("input-text");
      useFormStore.getState().addField("input-email");
    });
    render(<App />);
    await drag(paletteItem("CPF"), cardCenter(1)).drop();
    expect(fieldTypes()).toEqual(["input-text", "input-cpf", "input-email"]);
  });

  it("drop fora de qualquer alvo cai no droppable mais proximo (closestCenter)", async () => {
    render(<App />);
    await drag(paletteItem("CPF"), { clientX: 2000, clientY: 2000 }).drop();
    expect(fieldTypes()).toEqual(["input-cpf"]);
  });

  it("exibe o DragOverlayCard com o rotulo do tipo durante o arraste da paleta", async () => {
    render(<App />);
    const before = screen.getAllByText("CNPJ").length;
    const gesture = drag(paletteItem("CNPJ"), EMPTY_CANVAS_POINT);
    expect(screen.getAllByText("CNPJ")).toHaveLength(before + 1);
    await gesture.drop();
    await waitFor(() => expect(screen.getAllByText("CNPJ")).toHaveLength(before));
  });

  it("arrastar um campo sobre outro reordena ao vivo", async () => {
    act(() => {
      useFormStore.getState().addField("input-text");
      useFormStore.getState().addField("input-email");
      useFormStore.getState().addField("input-cpf");
    });
    render(<App />);
    const gesture = drag(dragHandles()[0], cardCenter(2));
    // onDragOver ja reordenou, antes do drop.
    expect(fieldTypes()).toEqual(["input-email", "input-cpf", "input-text"]);
    await gesture.drop();
    expect(fieldTypes()).toEqual(["input-email", "input-cpf", "input-text"]);
  });

  it("exibe o DragOverlayCard do campo arrastado no canvas", async () => {
    act(() => {
      useFormStore.getState().addField("input-text");
      useFormStore.getState().addField("input-cnpj");
    });
    render(<App />);
    const before = screen.getAllByText("CNPJ").length;
    const gesture = drag(dragHandles()[1], cardCenter(1));
    expect(screen.getAllByText("CNPJ")).toHaveLength(before + 1);
    await gesture.drop();
    await waitFor(() => expect(screen.getAllByText("CNPJ")).toHaveLength(before));
  });

  it("soltar um campo na area vazia do canvas mantem a ordem", async () => {
    act(() => {
      useFormStore.getState().addField("input-text");
      useFormStore.getState().addField("input-email");
    });
    render(<App />);
    await drag(dragHandles()[0], EMPTY_CANVAS_POINT).drop();
    expect(fieldTypes()).toEqual(["input-text", "input-email"]);
  });

  it("Escape cancela o arraste sem adicionar campo", async () => {
    render(<App />);
    drag(paletteItem("CPF"), EMPTY_CANVAS_POINT);
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await act(async () => {
      fireEvent.pointerUp(document, EMPTY_CANVAS_POINT);
    });
    expect(fieldTypes()).toEqual([]);
  });
});
