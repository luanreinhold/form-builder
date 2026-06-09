import { PropEditor } from "@/components/props/PropEditor";
import { useFormStore } from "@/store/formStore";

export function PropsPanel() {
  const selectedFieldId = useFormStore((s) => s.selectedFieldId);
  const field = useFormStore((s) => s.fields.find((f) => f.id === selectedFieldId) ?? null);
  const updateField = useFormStore((s) => s.updateField);
  const updateFieldMeta = useFormStore((s) => s.updateFieldMeta);
  const removeField = useFormStore((s) => s.removeField);

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase text-slate-500">Propriedades</h2>
      {!field ? (
        <p className="text-sm text-slate-400">Selecione um campo no canvas.</p>
      ) : (
        <PropEditor
          field={field}
          onChangeProp={(key, v) => updateField(field.id, { [key]: v })}
          onChangeMeta={(m) => updateFieldMeta(field.id, m)}
          onDelete={() => removeField(field.id)}
        />
      )}
    </aside>
  );
}
