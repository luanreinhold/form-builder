import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { REGISTRY } from "@/components/inputs/registry";
import { type FormPayload, FormSchema } from "@/schemas/form.schema";
import { type Field, FieldSchema, type FieldType } from "@/schemas/inputs.schema";

const STORAGE_KEY = "form-builder:draft";

interface FormState {
  formId: string;
  createdAt: string;
  updatedAt: string;
  fields: Field[];
  selectedFieldId: string | null;
}

interface FormActions {
  addField: (type: FieldType, index?: number) => string;
  removeField: (id: string) => void;
  updateField: (id: string, patch: Partial<Record<string, unknown>>) => void;
  updateFieldMeta: (id: string, meta: { class?: string; hide?: boolean; colSpan?: number }) => void;
  reorderFields: (fromId: string, toId: string) => void;
  reorderByIndex: (oldIndex: number, newIndex: number) => void;
  selectField: (id: string | null) => void;
  clearAll: () => void;
  importJSON: (payload: unknown) => { ok: true } | { ok: false; errors: string[] };
  exportJSON: () => FormPayload;
}

export type FormStore = FormState & FormActions;

export function initialState(): FormState {
  const now = new Date().toISOString();
  return {
    formId: nanoid(),
    createdAt: now,
    updatedAt: now,
    fields: [],
    selectedFieldId: null,
  };
}

function touch<T extends FormState>(state: T): T {
  return { ...state, updatedAt: new Date().toISOString() };
}

export const useFormStore = create<FormStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      addField: (type, index) => {
        const id = nanoid();
        const entry = REGISTRY[type];
        if (!entry) throw new Error(`Tipo desconhecido: ${type}`);
        const newField = {
          id,
          type,
          class: "",
          hide: false,
          colSpan: 12,
          props: { ...entry.defaultProps },
        } as Field;
        set((s) => {
          const next = [...s.fields];
          if (index === undefined || index < 0 || index >= next.length) next.push(newField);
          else next.splice(index, 0, newField);
          return touch({ ...s, fields: next, selectedFieldId: id });
        });
        return id;
      },

      removeField: (id) =>
        set((s) =>
          touch({
            ...s,
            fields: s.fields.filter((f) => f.id !== id),
            selectedFieldId: s.selectedFieldId === id ? null : s.selectedFieldId,
          }),
        ),

      updateField: (id, patch) =>
        set((s) =>
          touch({
            ...s,
            fields: s.fields.map((f) =>
              f.id === id ? ({ ...f, props: { ...f.props, ...patch } } as Field) : f,
            ),
          }),
        ),

      updateFieldMeta: (id, meta) =>
        set((s) =>
          touch({
            ...s,
            fields: s.fields.map((f) => (f.id === id ? ({ ...f, ...meta } as Field) : f)),
          }),
        ),

      reorderFields: (fromId, toId) => {
        const fields = get().fields;
        const oldIndex = fields.findIndex((f) => f.id === fromId);
        const newIndex = fields.findIndex((f) => f.id === toId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
        get().reorderByIndex(oldIndex, newIndex);
      },

      reorderByIndex: (oldIndex, newIndex) =>
        set((s) => {
          if (oldIndex === newIndex) return s;
          if (
            oldIndex < 0 ||
            newIndex < 0 ||
            oldIndex >= s.fields.length ||
            newIndex >= s.fields.length
          )
            return s;
          const next = [...s.fields];
          const [moved] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, moved);
          return touch({ ...s, fields: next });
        }),

      selectField: (id) => set((s) => ({ ...s, selectedFieldId: id })),

      clearAll: () =>
        set(() => {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            /* localStorage unavailable */
          }
          return initialState();
        }),

      importJSON: (payload) => {
        const parsed = FormSchema.safeParse(payload);
        if (!parsed.success) {
          return {
            ok: false,
            errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
          };
        }
        set(() =>
          touch({
            formId: parsed.data.formId,
            createdAt: parsed.data.createdAt,
            updatedAt: parsed.data.updatedAt,
            fields: parsed.data.fields,
            selectedFieldId: null,
          }),
        );
        return { ok: true };
      },

      exportJSON: () => {
        const s = get();
        return {
          schemaVersion: 1,
          formId: s.formId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          fields: s.fields,
        };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, fromVersion) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        if (fromVersion < 2) {
          const p = persisted as { fields?: unknown[] };
          if (Array.isArray(p.fields)) {
            p.fields = p.fields.map((f) =>
              f && typeof f === "object" && (f as Record<string, unknown>).colSpan === undefined
                ? { ...(f as Record<string, unknown>), colSpan: 12 }
                : f,
            );
          }
        }
        return persisted;
      },
      partialize: (state) => ({
        formId: state.formId,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        fields: state.fields,
      }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        const p = persisted as Partial<FormState>;
        if (!Array.isArray(p.fields)) return current;
        // Valida cada field via Zod; se algum falhar, descarta tudo.
        const validFields: Field[] = [];
        for (const f of p.fields) {
          const r = FieldSchema.safeParse(f);
          if (!r.success) {
            // Corrupted storage - reset to initial
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              /* noop */
            }
            return current;
          }
          validFields.push(r.data);
        }
        return {
          ...current,
          formId: p.formId ?? current.formId,
          createdAt: p.createdAt ?? current.createdAt,
          updatedAt: p.updatedAt ?? current.updatedAt,
          fields: validFields,
          selectedFieldId: null,
        };
      },
    },
  ),
);

export const STORAGE_KEY_EXPORT = STORAGE_KEY;
