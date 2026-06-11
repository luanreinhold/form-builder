import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { memo } from "react";
import { Icon } from "@/components/icons/Icon";
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
    // biome-ignore lint/a11y/useSemanticElements: <button> nativo nao pode conter os botoes aninhados de arrastar/remover
    <span
      ref={setNodeRef}
      style={style}
      data-field-id={field.id}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(field.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(field.id);
        }
      }}
      className={clsx(
        colSpanClass(field.colSpan),
        "group relative cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-colors dark:bg-slate-800",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-200 dark:border-indigo-400 dark:ring-indigo-500/30"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
        isDragging && "invisible",
        field.class,
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="-m-1 cursor-grab rounded p-1 text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-500 dark:hover:text-slate-200"
          aria-label="Arrastar campo"
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="drag-handle" width={16} height={16} />
        </button>
        <div className="min-w-0 flex-1">
          <InputPreview field={field} />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(field.id);
          }}
          className="-m-1 rounded p-1 text-red-500 opacity-0 transition-opacity hover:text-red-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 group-hover:opacity-100 dark:text-red-400 dark:hover:text-red-300"
          aria-label="Remover campo"
        >
          <Icon name="x" width={16} height={16} />
        </button>
      </div>
    </span>
  );
});
