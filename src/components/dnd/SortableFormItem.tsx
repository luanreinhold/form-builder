import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { memo } from "react";
import { InputPreview } from "@/components/inputs/InputPreview";
import type { Field } from "@/schemas/inputs.schema";
import { colSpanClass } from "@/utils/gridClass";

interface Props {
  field: Field;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export const SortableFormItem = memo(function SortableFormItem({
  field,
  selected,
  onSelect,
  onRemove,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    data: { source: "canvas", id: field.id },
  });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      data-field-id={field.id}
      onClick={() => onSelect(field.id)}
      className={clsx(
        colSpanClass(field.colSpan),
        "group relative rounded border bg-white p-3 shadow-sm cursor-pointer",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200",
        isDragging && "invisible",
        field.class,
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-slate-400 hover:text-slate-700"
          aria-label="Arrastar campo"
          onClick={(e) => e.stopPropagation()}
        >
          ⋮⋮
        </button>
        <div className="flex-1 min-w-0">
          <InputPreview field={field} />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(field.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm"
          aria-label="Remover campo"
        >
          ✕
        </button>
      </div>
    </span>
  );
});
