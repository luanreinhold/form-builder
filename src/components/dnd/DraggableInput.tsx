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
        "group flex min-h-[36px] w-full min-w-0 cursor-grab items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-left text-xs font-medium text-slate-700 shadow-sm transition-colors",
        "hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900",
        "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/60 dark:hover:bg-slate-700/80 dark:hover:text-indigo-300",
        isDragging && "opacity-40",
      )}
    >
      <Icon
        name={CATEGORY_ICONS[entry.category]}
        width={14}
        height={14}
        className="shrink-0 text-slate-500 transition-colors group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400"
      />
      <span className="truncate">{entry.label}</span>
    </button>
  );
}
