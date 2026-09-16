import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { memo } from "react";
import { Icon } from "@/components/icons/Icon";
import { InputPreview } from "@/components/inputs/InputPreview";
import type { Field } from "@/schemas/inputs.schema";
import { confirm } from "@/store/dialogStore";
import { toast } from "@/store/toastStore";
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
    // Translate (sem scale): com colSpans variaveis, o scaleX/scaleY da
    // strategy achata os cards para o tamanho do slot do item arrastado
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
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
        "group relative cursor-pointer overflow-hidden rounded-lg border bg-card p-3 shadow-sm transition-colors",
        selected
          ? "border-primary-active ring-2 ring-ring-soft"
          : "border-edge-soft hover:border-edge-hover",
        isDragging && "invisible",
        field.class,
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="-m-1 cursor-grab rounded p-1 text-faint transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          onClick={async (e) => {
            const shouldRemove: boolean = await confirm({
              title: "Remover campo",
              description: "Tem certeza que deseja remover este campo?",
            });
            e.stopPropagation();
            if (shouldRemove) {
              onRemove(field.id);
              toast({ description: "Campo removido.", variant: "success" });
            }
          }}
          className="-m-1 rounded p-1 text-danger opacity-0 transition-opacity hover:text-danger-hover focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger group-hover:opacity-100"
          aria-label="Remover campo"
        >
          <Icon name="x" width={16} height={16} />
        </button>
      </div>
    </span>
  );
});
