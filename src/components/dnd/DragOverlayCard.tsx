import { CATEGORY_ICONS, Icon } from "@/components/icons/Icon";
import { REGISTRY } from "@/components/inputs/registry";
import type { FieldType } from "@/schemas/inputs.schema";

interface Props {
  type: FieldType;
}

export function DragOverlayCard({ type }: Props) {
  const entry = REGISTRY[type];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary-active bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xl ring-2 ring-ring-soft">
      {entry && (
        <Icon
          name={CATEGORY_ICONS[entry.category]}
          width={14}
          height={14}
          className="shrink-0 text-primary-active"
        />
      )}
      {entry?.label ?? type}
    </div>
  );
}
