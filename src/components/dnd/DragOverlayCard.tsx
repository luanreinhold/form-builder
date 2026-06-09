import { REGISTRY } from "@/components/inputs/registry";
import type { FieldType } from "@/schemas/inputs.schema";

interface Props {
  type: FieldType;
}

export function DragOverlayCard({ type }: Props) {
  const entry = REGISTRY[type];
  return (
    <div className="rounded border-2 border-blue-500 bg-white px-3 py-2 text-sm shadow-lg">
      {entry?.label ?? type}
    </div>
  );
}
