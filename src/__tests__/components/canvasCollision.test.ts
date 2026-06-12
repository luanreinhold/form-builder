import type { ClientRect, CollisionDetection } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";
import { CANVAS_DROPPABLE_ID, canvasCollision } from "@/components/dnd/canvasCollision";

type Args = Parameters<CollisionDetection>[0];

function rect(left: number, top: number, width: number, height: number): ClientRect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

function makeArgs(
  rects: Record<string, ClientRect>,
  pointer: { x: number; y: number } | null,
  collisionRect: ClientRect = rect(0, 0, 10, 10),
): Args {
  const droppableRects = new Map(Object.entries(rects));
  const droppableContainers = Object.entries(rects).map(([id, r]) => ({
    id,
    key: id,
    data: { current: {} },
    disabled: false,
    node: { current: null },
    rect: { current: r },
  }));
  return {
    active: { id: "field-a", data: { current: { source: "canvas" } } },
    collisionRect,
    droppableRects,
    droppableContainers,
    pointerCoordinates: pointer,
  } as unknown as Args;
}

// Canvas 1200x800 com dois cards de meia largura (colSpan 6) na primeira linha
const layout: Record<string, ClientRect> = {
  [CANVAS_DROPPABLE_ID]: rect(0, 0, 1200, 800),
  "field-a": rect(0, 0, 600, 80),
  "field-b": rect(600, 0, 600, 80),
};

describe("canvasCollision", () => {
  it("prioriza o card sob o ponteiro em vez do container do canvas", () => {
    const result = canvasCollision(makeArgs(layout, { x: 650, y: 40 }));
    expect(result[0]?.id).toBe("field-b");
    expect(result.some((c) => c.id === CANVAS_DROPPABLE_ID)).toBe(false);
  });

  it("retorna o container quando o ponteiro esta em area vazia", () => {
    const result = canvasCollision(makeArgs(layout, { x: 600, y: 400 }));
    expect(result[0]?.id).toBe(CANVAS_DROPPABLE_ID);
  });

  it("sem ponteiro, faz fallback para closestCenter e ainda exclui o container", () => {
    // Centro do collisionRect (600, 340) mais proximo do centro do container
    // (600, 400) do que de qualquer card: o closestCenter puro elegeria o
    // container e o drop viraria no-op — regressao original
    const collisionRect = rect(500, 300, 200, 80);
    const result = canvasCollision(makeArgs(layout, null, collisionRect));
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.id).not.toBe(CANVAS_DROPPABLE_ID);
  });

  it("canvas vazio: container e o unico alvo", () => {
    const onlyCanvas: Record<string, ClientRect> = {
      [CANVAS_DROPPABLE_ID]: rect(0, 0, 1200, 800),
    };
    const result = canvasCollision(makeArgs(onlyCanvas, { x: 600, y: 400 }));
    expect(result[0]?.id).toBe(CANVAS_DROPPABLE_ID);
  });
});
