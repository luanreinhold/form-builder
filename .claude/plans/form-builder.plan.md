# Plano de Implementação: Form Builder

**Complexidade**: Large

## Restatement dos Requisitos

Um editor visual de formulários em React onde o usuário arrasta inputs (mapeados da V3) para uma área central, edita suas propriedades em um painel lateral, e exporta o formulário como JSON. A fonte de verdade dos tipos de input é a biblioteca `populis-v3-core` (Angular/Lit Element).

---

## Fase 1 — Setup do Projeto React

**Stack:**
- **React 18** + **TypeScript** + **Vite**
- **@dnd-kit/core** + **@dnd-kit/sortable** — drag and drop
- **Zustand** — estado global do formulário (leve, sem boilerplate)
- **Tailwind CSS** — layout das 3 colunas e estilização
- **react-hook-form** (opcional, para o painel de edição de props)
- **Zod** — validação e inferência de tipos dos schemas de input e do JSON exportado
- **Vitest** + **@testing-library/react** — testes unitários e de cobertura

**Estrutura de diretórios:**
```
src/
  components/
    layout/
      LeftPanel.tsx       # Paleta de inputs
      CanvasPanel.tsx     # Formulário DnD
      PropsPanel.tsx      # Editor de propriedades
    inputs/
      InputText.tsx
      InputTextarea.tsx
      InputNumber.tsx
      ... (um por tipo)
    dnd/
      DraggableInput.tsx
      DroppableCanvas.tsx
      SortableFormItem.tsx
  store/
    formStore.ts          # Zustand: lista de campos, selecionado, etc.
  types/
    input.types.ts        # Interfaces de cada input
    form.types.ts         # Schema JSON de exportação
  utils/
    exportForm.ts
```

---

## Fase 2 — Mapeamento de Inputs da V3

### Inputs identificados na V3 (`components/forms/inputs/`)

| Input V3 | Tipo React | Categoria |
|---|---|---|
| `input-text` | `InputText` | Texto |
| `input-textarea` | `InputTextarea` | Texto |
| `input-email` | `InputEmail` | Texto |
| `input-password` | `InputPassword` | Texto |
| `input-search` | `InputSearch` | Texto |
| `input-number` | `InputNumber` | Numérico |
| `input-decimal` | `InputDecimal` | Numérico |
| `input-money` | `InputMoney` | Numérico |
| `input-date` | `InputDate` | Data/Hora |
| `input-time` | `InputTime` | Data/Hora |
| `input-cpf` | `InputCpf` | Documentos BR |
| `input-cnpj` | `InputCnpj` | Documentos BR |
| `input-rg` | `InputRg` | Documentos BR |
| `input-pis` | `InputPis` | Documentos BR |
| `input-cep` | `InputCep` | Endereço |
| `input-phone` | `InputPhone` | Contato |
| `input-mask` | `InputMask` | Avançado |
| `input-color` | `InputColor` | Avançado |
| `input-file` | `InputFile` | Upload |
| `input-attach` | `InputAttach` | Upload |
| `input-photography` | `InputPhotography` | Upload |
| `select-component` | `Select` | Seleção |
| `select-multiple` | `SelectMultiple` | Seleção |
| `select-search` / `autocomplete` | `SelectSearch` | Seleção |
| `input-json` | `InputJson` | Avançado |

### Props base (herdadas por todos os inputs)

Mapeadas de `InputBaseComponent` e `BaseControl`:

| Prop V3 | Tipo | Descrição |
|---|---|---|
| `name` | `string` | Nome do campo (key no JSON) |
| `label` | `string` | Label visível |
| `placeholder` | `string` | Placeholder |
| `required` | `boolean` | Campo obrigatório |
| `readonly` | `boolean` | Somente leitura |
| `hint` | `string` | Tooltip/aria-label |
| `min` | `string` | Mínimo de caracteres |
| `max` | `string` | Máximo de caracteres |
| `showCaracterCounter` | `boolean` | Exibe contador |
| `highlight` | `boolean` | Destaque visual |
| `doNotTranslate` | `boolean` | Impede tradução |
| `customRequiredWarning` | `string` | Mensagem de erro customizada |
| `value` | `any` | Valor padrão |
| `labelClass` | `string` | Classe CSS da label |

### Props específicas por tipo

| Input | Props únicas |
|---|---|
| `InputText` | `doNotAllowSpecialCharacters: boolean` |
| `InputMoney` | `minValue: number`, `maxValue: number`, prefixo `R$` |
| `Select` | `source: Array<{key, value}>`, `expand: boolean` |
| `InputDate` | `format`, `minDate`, `maxDate` |
| `InputMask` | `mask: string` |
| `InputFile` / `InputAttach` | `accept: string`, `multiple: boolean` |

### Validação com Zod

Cada tipo de input terá um schema Zod correspondente em `src/types/input.types.ts`. Os schemas servem para:

1. **Inferir os tipos TypeScript** automaticamente (`z.infer<typeof InputTextSchema>`)
2. **Validar o painel de props** antes de aplicar alterações ao estado
3. **Validar o JSON exportado** antes do download/cópia, garantindo integridade

Exemplo conceitual de uso:
```ts
// BaseInputSchema cobre todas as props comuns
// Cada tipo estende com suas props específicas
// FormSchema valida o array de campos completo antes do export
```

O schema raiz `FormSchema` (em `src/types/form.types.ts`) valida o JSON de exportação completo, incluindo `formId` (UUID), `createdAt` (ISO 8601) e o array de `fields`.

---

## Fase 3 — Layout de 3 Colunas

```
┌──────────────────┬──────────────────────────┬──────────────────┐
│   Paleta (left)  │      Canvas (center)     │   Props (right)  │
│                  │                          │                  │
│  ┌────────────┐  │  ┌────────────────────┐  │  [Campo selec.]  │
│  │ Texto      │  │  │  Input Text        │  │                  │
│  │ Numérico   │  │  │  Select            │  │  label: ______   │
│  │ Data/Hora  │  │  │  Input Date        │  │  required: [ ]   │
│  │ Documentos │  │  │  ...               │  │  placeholder:___ │
│  │ Seleção    │  │  │  [ Arraste aqui ]  │  │  min: ___        │
│  │ Upload     │  │  └────────────────────┘  │  max: ___        │
│  └────────────┘  │                          │  [Excluir campo] │
└──────────────────┴──────────────────────────┴──────────────────┘
```

- **Left panel** (20%): inputs agrupados por categoria, cada item é `<Draggable>`
- **Center panel** (50%): `<DndContext>` com `<SortableContext>` — aceita drops e permite reordenar
- **Right panel** (30%): formulário dinâmico com as props do input selecionado; aparece somente quando há seleção

---

## Fase 4 — Implementação DnD com @dnd-kit

Seguindo a documentação do `dnd-kit`:

**Fluxo de drag da paleta → canvas:**
1. `DragStartEvent` → identifica o tipo de input (ex: `"input-text"`)
2. `DragEndEvent` → se `over.id === 'form-canvas'`, adiciona novo item ao estado com UUID + props padrão
3. `DragOverlay` → preview visual do input sendo arrastado

**Reordenação dentro do canvas:**
1. Canvas usa `SortableContext` com `verticalListSortingStrategy`
2. `DragEndEvent` dentro do canvas → `arrayMove()` reordena os itens no estado
3. Cada item do canvas é `<SortableFormItem id={field.id}>`

**Estado Zustand (`formStore.ts`):**
```ts
// estrutura conceitual
{
  fields: FormField[]        // lista ordenada de campos no canvas
  selectedFieldId: string | null
  addField(type, position)
  removeField(id)
  updateField(id, props)
  reorderFields(oldIndex, newIndex)
  exportJSON(): FormSchema
}
```

---

## Fase 5 — Painel de Edição de Props

- Renderizado dinamicamente com base no `selectedFieldId`
- Formulário controlado com inputs para cada prop do campo selecionado
- Props base sempre visíveis; props específicas aparecem conforme o tipo
- Botão **Excluir campo** com confirmação
- Mudanças em tempo real (atualizam o preview no canvas imediatamente via Zustand)

---

## Fase 6 — Exportação JSON

**Schema de saída:**
```json
{
  "formId": "uuid",
  "createdAt": "ISO date",
  "fields": [
    {
      "id": "uuid",
      "type": "input-text",
      "order": 0,
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

- Botão **Exportar JSON** no topo do canvas
- Copia para clipboard e/ou faz download do arquivo `.json`

---

## Arquivos a Criar

| Arquivo | Ação | Por quê |
|---|---|---|
| `package.json` + `vite.config.ts` | CREATE | Setup do projeto |
| `src/types/input.types.ts` | CREATE | Interfaces de todos os inputs V3 |
| `src/types/form.types.ts` | CREATE | Schema JSON de exportação |
| `src/store/formStore.ts` | CREATE | Estado global Zustand |
| `src/components/layout/LeftPanel.tsx` | CREATE | Paleta de inputs |
| `src/components/layout/CanvasPanel.tsx` | CREATE | Área DnD |
| `src/components/layout/PropsPanel.tsx` | CREATE | Editor de props |
| `src/components/dnd/DraggableInput.tsx` | CREATE | Item arrastável da paleta |
| `src/components/dnd/SortableFormItem.tsx` | CREATE | Item reordenável no canvas |
| `src/components/inputs/*.tsx` | CREATE | ~25 componentes de preview |
| `src/utils/exportForm.ts` | CREATE | Lógica de export JSON com validação Zod |
| `src/App.tsx` | CREATE | Layout principal 3 colunas |
| `src/__tests__/store/formStore.test.ts` | CREATE | Testes unitários do estado (add, remove, update, reorder, export) |
| `src/__tests__/utils/exportForm.test.ts` | CREATE | Testes de validação Zod no export JSON |
| `src/__tests__/components/CanvasPanel.test.tsx` | CREATE | Testes de integração do canvas (drop, reorder) |
| `src/__tests__/components/PropsPanel.test.tsx` | CREATE | Testes do painel de edição de props |
| `vitest.config.ts` | CREATE | Configuração do Vitest com coverage (meta: 80%) |

---

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Drag entre dois contextos DnD distintos (paleta → canvas) | Alta | Usar `DragOverlay` + lógica de detecção de `over.id` no `onDragEnd` |
| Props específicas de alguns inputs V3 não mapeadas | Média | Ler os arquivos `.ts` restantes na Fase 1 da implementação |
| Preview dos inputs complexos (money, mask, ocr) | Média | Inputs de preview são simplificados — não precisam replicar a lógica de máscara |
| Exportação de `source` para Selects (requer dados externos) | Baixa | Campo `source` editável como JSON string no painel de props |

---

## Critérios de Aceite

- [ ] Todos os inputs da V3 estão representados na paleta
- [ ] Drag da paleta → canvas adiciona o input no formulário
- [ ] Reordenação no canvas funciona por drag
- [ ] Clicar em um input abre o painel de props correto
- [ ] Editar props atualiza o preview em tempo real
- [ ] Botão excluir remove o campo
- [ ] Exportar JSON gera o schema correto com todos os campos e props
