import { useDraggable } from "@dnd-kit/core";
import type { RegistryEntry } from "@/types";

interface Props {
  entry: RegistryEntry;
}

export function DraggableInput({ entry }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${entry.type}`,
    data: { source: "palette", type: entry.type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      className={`w-full rounded border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm hover:border-blue-400 hover:bg-blue-50 ${isDragging ? "opacity-40" : ""}`}
    >
      {entry.label}
    </button>
  );
}
