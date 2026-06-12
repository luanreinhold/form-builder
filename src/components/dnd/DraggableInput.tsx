import { useDraggable } from "@dnd-kit/core";
import clsx from "clsx";
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
      title={entry.label}
      className={clsx(
        "group flex min-h-[36px] w-full min-w-0 cursor-grab items-center gap-2 rounded-lg border border-edge-input bg-card px-2.5 py-2 text-left text-xs font-medium text-foreground shadow-sm transition-colors",
        "hover:border-accent-edge hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        isDragging && "opacity-40",
      )}
    >
      <Icon
        name={CATEGORY_ICONS[entry.category]}
        width={14}
        height={14}
        className="shrink-0 text-faint transition-colors group-hover:text-primary-active"
      />
      <span className="truncate">{entry.label}</span>
    </button>
  );
}
