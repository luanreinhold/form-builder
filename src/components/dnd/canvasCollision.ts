import { type CollisionDetection, closestCenter, pointerWithin } from "@dnd-kit/core";

export const CANVAS_DROPPABLE_ID = "canvas-droppable";

/**
 * Deteccao de colisao do canvas: prioriza o card sob o ponteiro e so aceita o
 * container do canvas quando nenhum card colide (area vazia). Sem isso, o
 * closestCenter global elege o centro do container como alvo e o drop sobre
 * outro card vira um no-op.
 */
export const canvasCollision: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const collisions = pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
  const fieldCollisions = collisions.filter((c) => c.id !== CANVAS_DROPPABLE_ID);
  return fieldCollisions.length > 0 ? fieldCollisions : collisions;
};
