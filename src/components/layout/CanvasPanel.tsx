import { useDroppable } from "@dnd-kit/core";
import { SortableContext, type SortingStrategy } from "@dnd-kit/sortable";
import clsx from "clsx";
import { CANVAS_DROPPABLE_ID } from "@/components/dnd/canvasCollision";
import { SortableFormItem } from "@/components/dnd/SortableFormItem";
import { Icon } from "@/components/icons/Icon";
import { useFormStore } from "@/store/formStore";

// O reorder acontece ao vivo no onDragOver (AppShell): o grid real reflui e o
// preview fica fiel. Sem transform de projecao, que assume itens de tamanho igual.
const noProjectionStrategy: SortingStrategy = () => null;

export function CanvasPanel() {
  const fields = useFormStore((s) => s.fields);
  const selectedFieldId = useFormStore((s) => s.selectedFieldId);
  const selectField = useFormStore((s) => s.selectField);
  const removeField = useFormStore((s) => s.removeField);

  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROPPABLE_ID });

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div
        ref={setNodeRef}
        data-testid="canvas-drop-area"
        className={clsx(
          "mx-auto min-h-[400px] max-w-5xl rounded-xl border-2 border-dashed p-4 transition-colors",
          isOver ? "border-primary-active bg-primary-surface" : "border-edge-input bg-surface",
        )}
      >
        {fields.length === 0 ? (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-faint">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-faint">
              <Icon name="app-window" width={24} height={24} />
            </span>
            <p className="text-sm">Arraste inputs aqui para construir o formulario</p>
          </div>
        ) : (
          <SortableContext items={fields.map((f) => f.id)} strategy={noProjectionStrategy}>
            <div data-testid="canvas-grid" className="grid grid-cols-12 gap-3">
              {fields.map((f) => (
                <SortableFormItem
                  key={f.id}
                  field={f}
                  selected={f.id === selectedFieldId}
                  onSelect={selectField}
                  onRemove={removeField}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </main>
  );
}
