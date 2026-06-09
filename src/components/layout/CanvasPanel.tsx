import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import { useFormStore } from '@/store/formStore';
import { SortableFormItem } from '@/components/dnd/SortableFormItem';

export function CanvasPanel() {
  const fields = useFormStore((s) => s.fields);
  const selectedFieldId = useFormStore((s) => s.selectedFieldId);
  const selectField = useFormStore((s) => s.selectField);
  const removeField = useFormStore((s) => s.removeField);

  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-droppable' });

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div
        ref={setNodeRef}
        data-testid="canvas-drop-area"
        className={clsx(
          'mx-auto max-w-2xl rounded-lg border-2 border-dashed bg-white p-4 min-h-[400px]',
          isOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300',
        )}
      >
        {fields.length === 0 ? (
          <div className="flex h-full min-h-[360px] items-center justify-center text-slate-400">
            Arraste inputs aqui para construir o formulario
          </div>
        ) : (
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
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