import { Icon } from "@/components/icons/Icon";
import { PropEditor } from "@/components/props/PropEditor";
import { useFormStore } from "@/store/formStore";

export function PropsPanel() {
  const selectedFieldId = useFormStore((s) => s.selectedFieldId);
  const field = useFormStore((s) => s.fields.find((f) => f.id === selectedFieldId) ?? null);
  const updateField = useFormStore((s) => s.updateField);
  const updateFieldMeta = useFormStore((s) => s.updateFieldMeta);
  const removeField = useFormStore((s) => s.removeField);

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-edge bg-surface p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Propriedades</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Configure o campo selecionado</p>
      </div>
      {!field ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-edge-input bg-card/60 px-4 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-faint">
            <Icon name="sliders" width={20} height={20} />
          </span>
          <p className="text-sm text-faint">Selecione um campo no canvas.</p>
        </div>
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
