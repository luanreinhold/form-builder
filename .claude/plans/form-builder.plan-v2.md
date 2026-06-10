# Plano de Implementação: Form Builder

**Complexidade**: Large
**Versão**: v1 (offline, sem API/auth)
**Última revisão**: 2026-06-08
**Origem:** revisão de `form-builder.plan.md` (correções de mapeamento V3, adição de persistência local, alinhamento com `BaseControl`, e roadmap explícito)

---

## Restatement dos Requisitos

Editor visual de formulários em **React** onde o usuário arrasta inputs (mapeados da `populis-v3-core`, Angular/LitElement) para uma área central, edita propriedades em um painel lateral e exporta o formulário como JSON.

**Escopo v1 (este plano):**
- 100% client-side, sem backend nem autenticação.
- Persistência de rascunhos no **`localStorage`** (recuperação ao reabrir).
- Exportação e (opcionalmente) importação de JSON.

**Fora de escopo (v2+, ver Roadmap):**
- Integração com API (CRUD de formulários remotos).
- Autenticação / multi-tenant.
- Acessibilidade WCAG 2.2 AA completa (DnD por teclado etc.).

A fonte de verdade dos tipos de input e suas props é o submódulo git `populis-v3-core` (já adicionado ao repo).

---

## Diff vs. Plano Original

| Tópico | Plano original | Plano v2 |
|---|---|---|
| Persistência local | Não mencionada | Fase 6 dedicada (Zustand `persist` + Zod no merge) |
| Mapeamento V3 | 24 tipos | **Completo:** +`input-ocr`, `input-modal`, `input-cep-modal`, `input-attach-base64`, `input-report`, `input-date-calendar`; `input-keyboard` documentado como interno (excluído) |
| Selects | Listados junto com inputs | Seção separada; nota explícita de que vivem fora de `forms/inputs/` |
| Props base | 14 props | **18 props** (+ `requestFocus`, `keyboardOptions`, `class`, `hide`) |
| Shape do JSON exportado | `{ id, type, order, props }` | `{ schemaVersion, formId, createdAt, updatedAt, fields: [{ id, type, class, hide, props }] }` — alinhado com `BaseControl` da V3 |
| `react-hook-form` | "(opcional)" | Dispensado — decisão tomada |
| Performance | Não mencionada | Seletores Zustand explícitos + memoização do `SortableFormItem` |
| Roadmap v2 | Não existia | Seção dedicada |
| Riscos | 4 itens | 9 itens (storage corrompido, quota, re-renders, type explosion, submódulo) |
| Critérios de aceite | 7 itens | 13 itens (inclui persistência e build sem warnings) |

---

## Stack

| Camada | Biblioteca | Notas |
|---|---|---|
| Build / dev server | **Vite** | React + TS |
| UI | **React 18** + **TypeScript** | Strict mode |
| DnD | **@dnd-kit/core** + **@dnd-kit/sortable** | Cross-context drag (paleta -> canvas) e sortable dentro do canvas |
| Estado | **Zustand** + middleware `persist` | Persistência transparente em `localStorage`. Usar **seletores** para evitar re-render de toda a árvore |
| Estilização | **Tailwind CSS** | Layout das 3 colunas + utilitários |
| Validação / tipos | **Zod** | Schemas como fonte única; `z.infer` gera os tipos TS |
| Testes | **Vitest** + **@testing-library/react** + `@testing-library/user-event` | Meta: **80% cobertura** de statements |
| Utilitários | `nanoid` (IDs), `clsx` (classes condicionais) | |

**Dispensado da v1:** `react-hook-form`. O painel de props é pequeno, controlado e já passa por Zod — RHF traria surface extra sem retorno claro.

**Estrutura de diretórios:**

```
src/
  components/
    layout/
      AppShell.tsx        # 3 colunas + toolbar
      LeftPanel.tsx       # Paleta de inputs (agrupada por categoria)
      CanvasPanel.tsx     # Formulário com DnD
      PropsPanel.tsx      # Editor de propriedades
      Toolbar.tsx         # Exportar / Importar / Limpar
    inputs/               # Componentes de preview (1 por tipo da V3)
      InputText.tsx
      InputMoney.tsx
      ... (~26 componentes; ver Fase 2)
      registry.ts         # type -> { component, defaultProps, schema, category }
    dnd/
      DraggableInput.tsx  # Item da paleta
      DroppableCanvas.tsx
      SortableFormItem.tsx
      DragOverlayCard.tsx
    props/
      PropEditor.tsx      # Renderiza editores dinâmicos
      editors/            # Editores por tipo: StringEditor, BooleanEditor, JsonEditor...
  store/
    formStore.ts          # Zustand: fields, selectedFieldId, ações
    persistConfig.ts      # Configuração do middleware persist
  schemas/
    base.schema.ts        # BaseInputSchema (props comuns a todos os inputs)
    inputs.schema.ts      # Schema discriminado por type
    form.schema.ts        # FormSchema (raiz do JSON exportado)
  utils/
    exportForm.ts         # Serializa + valida com Zod
    importForm.ts         # Parse + valida JSON externo
  types/
    index.ts              # Re-exporta tipos inferidos do Zod
  App.tsx
  main.tsx
  __tests__/
    store/
    utils/
    components/
```

---

## Fase 1 — Setup do Projeto React

1. `npm create vite@latest . -- --template react-ts` (ou `pnpm`)
2. Instalar dependências: `@dnd-kit/core @dnd-kit/sortable zustand zod nanoid clsx tailwindcss`
3. Dev/test: `vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/coverage-v8`
4. Configurar Tailwind (`tailwind.config.js`, `postcss.config.js`, diretivas em `src/index.css`).
5. Configurar `vitest.config.ts` com `environment: 'jsdom'`, coverage v8, threshold 80%.
6. `tsconfig.json`: `"strict": true`, paths para `@/*`.
7. Confirmar que `populis-v3-core/` está como submódulo (já está; apenas consultado para mapeamento).

**Deliverable:** projeto buildando vazio, `pnpm dev` e `pnpm test` rodando.

---

## Fase 2 — Mapeamento de Inputs da V3

### 2.1 Inputs em `populis-v3-core/components/forms/inputs/`

Lista **completa** baseada no `index.ts` da V3:

| Input V3 | Tipo React | Categoria | Incluir v1? |
|---|---|---|---|
| `input-text` | `InputText` | Texto | Sim |
| `input-textarea` | `InputTextarea` | Texto | Sim |
| `input-email` | `InputEmail` | Texto | Sim |
| `input-password` | `InputPassword` | Texto | Sim |
| `input-search` | `InputSearch` | Texto | Sim |
| `input-number` | `InputNumber` | Numérico | Sim |
| `input-decimal` | `InputDecimal` | Numérico | Sim |
| `input-money` | `InputMoney` | Numérico | Sim |
| `input-date` | `InputDate` | Data/Hora | Sim |
| `input-date-calendar` | `InputDateCalendar` | Data/Hora | Sim (variante calendário-only) |
| `input-time` | `InputTime` | Data/Hora | Sim |
| `input-cpf` | `InputCpf` | Documentos BR | Sim |
| `input-cnpj` | `InputCnpj` | Documentos BR | Sim |
| `input-rg` | `InputRg` | Documentos BR | Sim |
| `input-pis` | `InputPis` | Documentos BR | Sim |
| `input-cep` | `InputCep` | Endereço | Sim |
| `input-phone` | `InputPhone` | Contato | Sim |
| `input-mask` | `InputMask` | Avançado | Sim |
| `input-color` | `InputColor` | Avançado | Sim |
| `input-file` | `InputFile` | Upload | Sim |
| `input-attach` | `InputAttach` | Upload | Sim |
| `input-attach-base64` | `InputAttachBase64` | Upload | Sim |
| `input-photography` | `InputPhotography` | Upload | Sim |
| `input-modal` | `InputModal` | Modal/Lookup | Sim |
| `input-cep-modal` | `InputCepModal` | Modal/Lookup | Sim |
| `input-json` | `InputJson` | Avançado | Sim |
| `input-ocr` | `InputOcr` | Avançado | Parcial — paleta + props básicas; preview simplificado (sem captura) |
| `input-report` | `InputReport` | Avançado | Parcial — paleta + props básicas |
| `input-keyboard` | — | — | Não — é controle interno (teclado virtual), não input expositivo |

### 2.2 Selects (fora de `forms/inputs/`)

Na V3 os selects vivem em pastas próprias: `components/select-multiple/`, `components/select-search/`, etc. Para tratá-los como inputs do builder, incluímos:

| Componente V3 | Tipo React | Categoria |
|---|---|---|
| `select-component` (custom-element `select-component`) | `Select` | Seleção |
| `select-multiple` | `SelectMultiple` | Seleção |
| `select-search` / autocomplete | `SelectSearch` | Seleção |
| `dynamic-select` | `DynamicSelect` | Seleção |

> **Decisão de escopo:** leitura dos arquivos `.ts` em `components/select-*` é parte da Fase 1 da implementação para confirmar props específicas (`source`, `expand`, `optionLabel`, `optionValue`, etc.).

### 2.3 Props base (herdadas por **todos** os inputs)

Extraídas de `populis-v3-core/components/base/input-base.component.ts` (campos `@property`) e `base-control.ts` (campos `BaseControl`):

**De `InputBaseComponent` (todas opcionais salvo `name`):**

| Prop | Tipo | Notas |
|---|---|---|
| `name` | `string` | **Obrigatório.** Chave no JSON do formulário. |
| `label` | `string` | Label visível |
| `placeholder` | `string` | |
| `required` | `boolean` | |
| `readonly` | `boolean` | |
| `hint` | `string` | Usado em `aria-label` e `title` |
| `min` | `string` | Mínimo de caracteres |
| `max` | `string` | Máximo de caracteres |
| `showCaracterCounter` | `boolean` | Contador ao lado da label |
| `highlight` | `boolean` | Destaque visual |
| `doNotTranslate` | `boolean` | |
| `customRequiredWarning` | `string` | Mensagem de erro custom |
| `value` | `unknown` | Default value |
| `labelClass` | `string` | Classe CSS da label |
| `requestFocus` | `boolean` | Solicita foco automático |
| `keyboardOptions` | `object` | Configura teclado virtual; v1 expõe como JSON editável (raramente usado) |

**De `BaseControl` (envoltório do controle no formulário):**

| Prop | Tipo | Notas |
|---|---|---|
| `class` | `string` | Classe CSS aplicada ao wrapper |
| `hide` | `boolean` | Esconde o controle do formulário |
| `type` | `string` | Discriminante (já é nossa chave `type`) |

### 2.4 Props específicas por tipo (não exaustivo — confirmar na Fase 1)

| Input | Props únicas |
|---|---|
| `InputText` | `doNotAllowSpecialCharacters: boolean` |
| `InputMoney` | `minValue: number`, `maxValue: number`, prefixo fixo `R$ ` |
| `InputMask` | `mask: string`, `clearSpecialCharacter: boolean`, `toastrMessage: string` |
| `InputDate` / `InputDateCalendar` | `format`, `minDate`, `maxDate` |
| `InputFile` / `InputAttach` / `InputAttachBase64` | `accept: string`, `multiple: boolean` |
| `Select*` | `source: Array<{key, value}>`, `expand?: boolean`, `optionLabel?`, `optionValue?` |
| `InputModal` / `InputCepModal` | `modalProps: object` |
| `InputJson` | (apenas base) |
| `InputOcr` | metadata de OCR (mantido como JSON livre na v1) |

### 2.5 Validação com Zod

Cada tipo de input tem um schema Zod em `src/schemas/inputs.schema.ts`. Usaremos **discriminated union** por `type`:

```ts
// src/schemas/base.schema.ts (conceitual)
export const BaseInputPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  readonly: z.boolean().optional(),
  hint: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  showCaracterCounter: z.boolean().optional(),
  highlight: z.boolean().optional(),
  doNotTranslate: z.boolean().optional(),
  customRequiredWarning: z.string().optional(),
  value: z.unknown().optional(),
  labelClass: z.string().optional(),
  requestFocus: z.boolean().optional(),
  keyboardOptions: z.record(z.unknown()).optional(),
});

// src/schemas/inputs.schema.ts (conceitual)
export const InputTextSchema = z.object({
  type: z.literal('input-text'),
  props: BaseInputPropsSchema.extend({
    doNotAllowSpecialCharacters: z.boolean().optional(),
  }),
});
// ... um por tipo
export const FieldSchema = z.discriminatedUnion('type', [
  InputTextSchema, InputMoneySchema, InputMaskSchema, /* ... */
]);
```

Os schemas servem para:
1. **Inferir tipos TS** (`type Field = z.infer<typeof FieldSchema>`).
2. **Validar entrada no painel de props** antes de aplicar no estado.
3. **Validar export** antes do download.
4. **Validar import** ao carregar JSON externo.
5. **Validar rehidratação do localStorage** (defesa contra corrupção).

---

## Fase 3 — Layout de 3 Colunas

```
+----------------+----------------------------+----------------+
| Toolbar: [Importar] [Exportar] [Limpar] [Auto-save: ok]      |
+----------------+----------------------------+----------------+
| Paleta (left)  |   Canvas (center)          | Props (right)  |
|                |                            |                |
|  > Texto       |  +-------------------+     | Campo: nome    |
|  > Numérico    |  | [Input Text]      |     |                |
|  > Data/Hora   |  | [Select]          |     | name: ____     |
|  > Documentos  |  | [Input Date]      |     | label: ____    |
|  > Seleção     |  | ...               |     | required: [ ]  |
|  > Upload      |  | +- Arraste aqui -+|     | placeholder:__ |
|  > Modal       |  +-------------------+     | ...            |
|  > Avançado    |                            | [Excluir]      |
+----------------+----------------------------+----------------+
```

- **Left** (~20%): inputs agrupados por categoria (colapsáveis), cada item é `<Draggable>`.
- **Center** (~50%): `<DndContext>` com `<SortableContext>` (verticalListSortingStrategy); aceita drops e reordena.
- **Right** (~30%): aparece somente quando há `selectedFieldId`; mostra props base + props específicas.
- **Toolbar** no topo: ações globais + indicador de auto-save.

---

## Fase 4 — DnD com @dnd-kit

**Dois fluxos distintos** num mesmo `DndContext` (escopo único evita conflito de IDs):

**(a) Paleta -> Canvas (cria novo campo):**
1. `onDragStart`: salvar `active.data.current = { source: 'palette', type: 'input-text' }` no DragOverlay.
2. `onDragEnd`: se `over?.id === 'canvas-droppable'` **e** `active.data.current.source === 'palette'`, chamar `addField(type, position)`.
3. `DragOverlay` exibe um card-preview do tipo arrastado.

**(b) Reordenar dentro do Canvas:**
1. Cada item é `<SortableFormItem id={field.id} data={{ source: 'canvas' }}>`.
2. `onDragEnd`: se `active.data.current.source === 'canvas'` **e** `over` é outro item do canvas, `arrayMove(fields, oldIndex, newIndex)`.

**Edge cases já cobertos no design:**
- Drop fora do canvas -> ignorar (não acontece nada).
- Drag interrompido (esc) -> `onDragCancel` limpa overlay.
- Drop em si mesmo durante reorder -> no-op (índices iguais).

**Estado Zustand (`formStore.ts`):**

```ts
// estrutura conceitual
type State = {
  fields: Field[];
  selectedFieldId: string | null;
  // ações
  addField(type: FieldType, index?: number): void;     // gera id (nanoid) + defaultProps
  removeField(id: string): void;
  updateField(id: string, patch: Partial<FieldProps>): void;
  reorderFields(oldIndex: number, newIndex: number): void;
  selectField(id: string | null): void;
  clearAll(): void;
  importJSON(payload: unknown): { ok: true } | { ok: false; errors: ZodIssue[] };
  exportJSON(): FormSchema;
};
```

**Performance:** componentes consomem **slices** via seletores (ex.: `useFormStore((s) => s.fields)`, `useFormStore((s) => s.selectedFieldId)`), evitando re-render de toda a árvore a cada keystroke no painel.

---

## Fase 5 — Painel de Edição de Props

- Renderizado dinamicamente com base no `selectedFieldId` e em `inputs/registry.ts` (que mapeia `type -> schema -> editores`).
- Cada prop usa um **editor primitivo** correspondente ao tipo Zod: `string -> StringEditor`, `boolean -> BooleanEditor`, `record -> JsonEditor`, etc.
- Mudanças são **controladas**: cada onChange chama `updateField(id, { [key]: value })`; o canvas atualiza em tempo real (Zustand notifica).
- Validação acontece em duas etapas:
  1. **Por campo (debounced):** `BaseInputPropsSchema.shape[key].safeParse(value)` -> mostra erro inline.
  2. **No commit/export:** `FieldSchema.safeParse(field)` -> bloqueia export se inválido.
- Botão **Excluir campo** com confirmação (modal simples ou `window.confirm` na v1).

---

## Fase 6 — Persistência Local (NOVA na revisão)

**Objetivo:** não perder trabalho ao fechar/recarregar o navegador. Sem backend.

**Implementação:**

1. **Zustand `persist` middleware** com:
   - `name: 'form-builder:draft'`
   - `storage: createJSONStorage(() => localStorage)`
   - `version: 1` (para futuras migrations)
   - `partialize`: persistir apenas `{ fields, selectedFieldId }` (não persistir flags de UI transientes).
   - `merge`: ao rehidratar, **validar com Zod** (`FormSchema.safeParse`). Em caso de falha, descartar storage e iniciar limpo (com toast informando).

2. **Auto-save:** o próprio `persist` já salva a cada mudança. Indicador visual na toolbar mostra "Salvo".

3. **Ação "Limpar formulário"**: zera fields + remove chave do localStorage.

4. **Quota:** `localStorage` tem ~5MB. Formulários típicos ficam abaixo de 100KB. Não tratar quota como erro crítico na v1 — apenas logar warning.

5. **Múltiplos formulários:** **fora de escopo v1** (apenas um draft ativo). Roadmap v2.

---

## Fase 7 — Exportação / Importação JSON

### 7.1 Schema do JSON exportado

```json
{
  "schemaVersion": 1,
  "formId": "uuid",
  "createdAt": "2026-06-08T10:00:00Z",
  "updatedAt": "2026-06-08T10:42:00Z",
  "fields": [
    {
      "id": "nanoid",
      "type": "input-text",
      "class": "",
      "hide": false,
      "props": {
        "name": "nome",
        "label": "Nome completo",
        "required": true,
        "placeholder": "Digite seu nome",
        "max": "100"
      }
    }
  ]
}
```

**Notas de compatibilidade V3:**
- `class`, `hide`, `type`, `props` espelham a estrutura de `BaseControl` da V3 (facilita consumo direto pela V3 no futuro).
- `id` é metadado do builder; pode ser ignorado por consumidores V3.
- A ordem dos campos é a ordem do array (não há `order` numérico — simplifica e elimina inconsistências).
- `schemaVersion` permite migrations futuras quando a estrutura mudar.

### 7.2 Exportar

- Botão **Exportar JSON** na toolbar.
- Roda `FormSchema.safeParse(state)` -> se falhar, mostra erros e bloqueia.
- Se ok: oferece **copiar para clipboard** e **download `.json`**.

### 7.3 Importar (v1)

- Botão **Importar JSON** na toolbar.
- Aceita upload de `.json` ou paste em textarea.
- `FormSchema.safeParse(parsed)` -> se ok, substitui estado; se não, mostra erros formatados.
- Confirma antes de sobrescrever rascunho atual.

---

## Arquivos a Criar

| Arquivo | Ação | Por quê |
|---|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json` | CREATE | Setup do projeto |
| `tailwind.config.js`, `postcss.config.js`, `src/index.css` | CREATE | Tailwind |
| `vitest.config.ts` | CREATE | Vitest + coverage 80% |
| `src/schemas/base.schema.ts` | CREATE | Props comuns (Zod) |
| `src/schemas/inputs.schema.ts` | CREATE | Discriminated union por tipo |
| `src/schemas/form.schema.ts` | CREATE | Raiz do JSON exportado |
| `src/types/index.ts` | CREATE | Re-export de tipos inferidos |
| `src/store/formStore.ts` | CREATE | Zustand + ações |
| `src/store/persistConfig.ts` | CREATE | Config do `persist` middleware |
| `src/components/layout/AppShell.tsx` | CREATE | 3 colunas + toolbar |
| `src/components/layout/LeftPanel.tsx` | CREATE | Paleta agrupada |
| `src/components/layout/CanvasPanel.tsx` | CREATE | DnD container |
| `src/components/layout/PropsPanel.tsx` | CREATE | Editor de props |
| `src/components/layout/Toolbar.tsx` | CREATE | Export/Import/Limpar |
| `src/components/dnd/DraggableInput.tsx` | CREATE | Item paleta |
| `src/components/dnd/SortableFormItem.tsx` | CREATE | Item canvas |
| `src/components/dnd/DragOverlayCard.tsx` | CREATE | Preview overlay |
| `src/components/inputs/*.tsx` | CREATE | ~26 previews (1 por tipo) |
| `src/components/inputs/registry.ts` | CREATE | type -> { component, defaultProps, schema, category, label, icon } |
| `src/components/props/PropEditor.tsx` + `editors/*` | CREATE | Editores genéricos por tipo Zod |
| `src/utils/exportForm.ts`, `importForm.ts` | CREATE | Serialização + validação |
| `src/App.tsx`, `src/main.tsx` | CREATE | Bootstrap |
| `src/__tests__/store/formStore.test.ts` | CREATE | Add/remove/update/reorder/clear/export |
| `src/__tests__/store/persist.test.ts` | CREATE | Rehidratação + corrupção de localStorage |
| `src/__tests__/utils/exportForm.test.ts` | CREATE | Validação Zod do export |
| `src/__tests__/utils/importForm.test.ts` | CREATE | Validação Zod do import |
| `src/__tests__/schemas/inputs.test.ts` | CREATE | Cada schema aceita defaults e rejeita inválidos |
| `src/__tests__/components/CanvasPanel.test.tsx` | CREATE | Drop, reorder, seleção |
| `src/__tests__/components/PropsPanel.test.tsx` | CREATE | Edição reflete no estado |
| `src/__tests__/components/Toolbar.test.tsx` | CREATE | Export/Import/Limpar |

---

## Estratégia de Testes

| Camada | Tipo | Foco |
|---|---|---|
| Schemas Zod | Unit | Defaults aceitos, inválidos rejeitados (cada tipo) |
| Store | Unit | Mutações puras (add/remove/update/reorder/clear) |
| Persist | Unit | Snapshot -> rehidratação; storage corrompido -> reset limpo |
| Export/Import | Unit | Round-trip (export -> import -> equivalente) |
| Painel props | Integration | Edição muda estado e canvas em tempo real |
| Canvas | Integration | Drop cria item; reorder funciona; seleção destaca |
| Toolbar | Integration | Export gera download; import sobrescreve; limpar zera |

**Meta de cobertura:** 80% statements/branches. Configurado em `vitest.config.ts` com `coverage.thresholds`.

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Drag entre paleta e canvas no mesmo `DndContext` confunde IDs | Alta | Alto | Discriminar via `active.data.current.source = 'palette' \| 'canvas'` no `onDragEnd` (já mapeado na Fase 4) |
| Props específicas não-mapeadas de inputs menos comuns (ocr, report, modal) | Média | Médio | Fase 1 da implementação inclui leitura dos `.component.ts` restantes; v1 expõe props básicas + JSON livre como fallback |
| Preview de inputs com lógica complexa (money, mask, ocr) divergir do real | Média | Baixo | Previews são **visuais e simplificados** — não precisam replicar máscara ou OCR; documentar no README |
| `source` de Selects requer dados externos | Baixa | Médio | Campo editável como JSON inline no painel de props (não fetch) |
| Corrupção/incompatibilidade do localStorage entre versões | Média | Médio | `version` no `persist` + validação Zod no `merge`; em falha -> reset com aviso |
| Quota `localStorage` excedida (formulários muito grandes) | Baixa | Baixo | Logar warning; mensagem ao usuário sugerindo exportar |
| Re-renders excessivos no canvas a cada keystroke | Média | Médio | Zustand com seletores; memoizar `SortableFormItem` |
| Type explosion (Zod schemas x ~30 tipos) | Média | Baixo | Schema discriminado: extends de `BaseInputPropsSchema`; gerador de boilerplate se necessário |
| `populis-v3-core` submódulo desatualizado/quebrado | Baixa | Baixo | Apenas leitura no plano; código não importa do submódulo na v1 |

---

## Critérios de Aceite (v1)

- [ ] Todos os inputs da V3 listados na seção 2.1 aparecem na paleta agrupados por categoria.
- [ ] Drag da paleta -> canvas adiciona o input no formulário com defaults válidos.
- [ ] Reordenação dentro do canvas funciona por drag.
- [ ] Clicar em um campo do canvas abre o painel de props correspondente.
- [ ] Editar props atualiza o preview no canvas em tempo real.
- [ ] Validação Zod inline no painel; botão **Exportar** desabilita se houver erros.
- [ ] Botão **Excluir** remove o campo (com confirmação).
- [ ] Botão **Exportar JSON** copia para clipboard e oferece download `.json`.
- [ ] Botão **Importar JSON** carrega arquivo válido e rejeita inválido com mensagem clara.
- [ ] **Persistência:** ao recarregar o navegador, o rascunho continua intacto.
- [ ] **Limpar formulário** zera estado + remove chave do localStorage.
- [ ] Cobertura de testes >= 80% statements/branches.
- [ ] `npm run build` passa sem warnings de TS.

---

## Roadmap v2+ (Fora de Escopo Agora)

- **Múltiplos formulários** (lista + CRUD local).
- **Integração API**: persistência remota, versionamento server-side.
- **Autenticação**: login, multi-tenant, permissões.
- **Acessibilidade WCAG 2.2 AA**: DnD por teclado (`KeyboardSensor` do @dnd-kit), navegação ARIA correta, foco gerenciado, contraste auditado.
- **Histórico (undo/redo)**: stack de patches sobre o estado.
- **Templates**: salvar formulários como template reutilizável.
- **Renderer V3**: gerar diretamente as tags `<input-text>...</input-text>` da V3 a partir do JSON (consumo nativo).
- **Validação avançada** (regex, dependências entre campos, expressões).
- **i18n** do próprio builder (a V3 já tem `doNotTranslate`).

---

## Notas de Execução

- **Ordem sugerida das fases na implementação:** Fase 1 (setup) -> Fase 2 (schemas + registry, sem UI) -> Fase 6 (store + persist) -> Fase 3 (layout vazio) -> Fase 4 (DnD) -> Fase 5 (props) -> Fase 7 (export/import) -> Polimento + testes a 80%.
- A `populis-v3-core` é apenas **referência** na v1 — nenhum código dela é importado. Os previews React são reimplementações simplificadas.
- **Pseudo-código detalhado** dos pontos críticos (Zustand store, DnD handlers, persist config, schemas Zod) será produzido no comando `/ecc:plan` ou `/ecc:prp-implement` antes da escrita do código.
