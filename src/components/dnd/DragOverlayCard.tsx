import { CATEGORY_ICONS, Icon } from "@/components/icons/Icon";
import { REGISTRY } from "@/components/inputs/registry";
import type { FieldType } from "@/schemas/inputs.schema";

interface Props {
  type: FieldType;
}

export function DragOverlayCard({ type }: Props) {
  const entry = REGISTRY[type];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-indigo-500 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-xl ring-2 ring-indigo-200 dark:border-indigo-400 dark:bg-slate-800 dark:text-slate-100 dark:ring-indigo-500/30">
      {entry && (
        <Icon
          name={CATEGORY_ICONS[entry.category]}
          width={14}
          height={14}
          className="shrink-0 text-indigo-500 dark:text-indigo-400"
        />
      )}
      {entry?.label ?? type}
    </div>
  );
}
