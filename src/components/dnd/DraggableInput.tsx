import { useDraggable } from "@dnd-kit/core";
import { CATEGORY_ICONS, Icon } from "@/components/icons/Icon";
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
      className={`flex w-full items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-left text-sm shadow-sm hover:border-blue-400 hover:bg-blue-50 ${isDragging ? "opacity-40" : ""}`}
    >
      <Icon
        name={CATEGORY_ICONS[entry.category]}
        width={14}
        height={14}
        className="shrink-0 text-slate-400"
      />
      {entry.label}
    </button>
  );
}
