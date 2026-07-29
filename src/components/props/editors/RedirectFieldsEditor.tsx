import { Button } from "@/components/ui/Button";
import { pickField } from "@/store/fieldPickerStore";
import { useFormStore } from "@/store/formStore";

export type RedirectFieldsValue = Record<string, string>;

interface Props {
  label: string;
  value: unknown;
  onChange: (v: RedirectFieldsValue) => void;
  /** Id do campo em edicao — excluido do picker para evitar auto-referencia. */
  fieldId?: string;
}

const inputClass =
  "w-full rounded-lg border border-edge-input bg-card px-2.5 py-1.5 text-sm text-foreground transition-colors focus:border-primary-active focus:outline-none focus:ring-2 focus:ring-ring-soft";

function normalize(value: unknown): RedirectFieldsValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: RedirectFieldsValue = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/**
 * RedirectFieldsEditor — edita o `redirectFields` do input-modal:
 * `{ nomeDoCampoDoFormulario: propriedadeDoItemSelecionado }`. A chave e
 * escolhida via FieldPicker (modal com os campos do formulario); o valor e
 * texto livre, pois o shape do item vem do backend.
 *
 * Chaves que nao correspondem a nenhum `name` do formulario (orfas apos um
 * rename) ganham aviso visual — decisao registrada em
 * .claude/decisions/2026-07-29-redirect-fields-chave-orfa.md
 */
export function RedirectFieldsEditor({ label, value, onChange, fieldId }: Props) {
  const fields = useFormStore((s) => s.fields);
  const redirects = normalize(value);
  const entries = Object.entries(redirects);
  const knownNames = new Set(
    fields.map((f) => (f.props as { name?: string }).name ?? "").filter(Boolean),
  );

  async function addEntry() {
    const name = await pickField({
      title: "Redirecionar valor para qual campo?",
      excludeFieldId: fieldId,
      disabledNames: Object.keys(redirects),
    });
    if (!name) return;
    onChange({ ...redirects, [name]: "" });
  }

  async function changeKey(oldKey: string) {
    const name = await pickField({
      title: "Redirecionar valor para qual campo?",
      excludeFieldId: fieldId,
      disabledNames: Object.keys(redirects).filter((k) => k !== oldKey),
    });
    if (!name || name === oldKey) return;
    const next: RedirectFieldsValue = {};
    for (const [k, v] of entries) next[k === oldKey ? name : k] = v;
    onChange(next);
  }

  function removeEntry(key: string) {
    const next = { ...redirects };
    delete next[key];
    onChange(next);
  }

  function changeValue(key: string, v: string) {
    onChange({ ...redirects, [key]: v });
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      {entries.length === 0 && (
        <p className="rounded-lg border border-dashed border-edge-input px-3 py-3 text-xs text-faint">
          Nenhum redirecionamento. Adicione para preencher campos do formulario com propriedades do
          item selecionado no modal.
        </p>
      )}
      {entries.map(([key, val]) => {
        const orphan = !knownNames.has(key);
        return (
          <div
            key={key}
            className={`space-y-1.5 rounded-lg border p-2 ${
              orphan ? "border-amber-500/60 bg-amber-500/5" : "border-edge-input"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Alterar campo de destino ${key}`}
                onClick={() => changeKey(key)}
                title="Clique para trocar o campo de destino"
                className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-soft"
              >
                {key}
              </button>
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Remover redirecionamento ${key}`}
                onClick={() => removeEntry(key)}
              >
                Remover
              </Button>
            </div>
            {orphan && (
              <p role="alert" className="text-[11px] text-amber-600 dark:text-amber-400">
                Campo "{key}" nao existe no formulario (foi renomeado ou removido).
              </p>
            )}
            <label className="block">
              <span className="mb-1 block text-[11px] text-faint">propriedade do item</span>
              <input
                aria-label={`Propriedade do item para ${key}`}
                value={val}
                onChange={(e) => changeValue(key, e.target.value)}
                placeholder="ex.: atrNomePessoa"
                className={inputClass}
              />
            </label>
          </div>
        );
      })}
      <Button variant="secondary" size="sm" onClick={addEntry}>
        Adicionar redirecionamento
      </Button>
    </div>
  );
}
