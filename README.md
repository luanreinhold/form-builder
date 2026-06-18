# Form Builder

Editor visual de formulários em **React + TypeScript**. Arraste inputs da paleta (mapeados da `populis-v3-core`) para um canvas central, edite propriedades no painel lateral e exporte o formulário como JSON.

> **Versão atual:** v1 — 100% client-side, sem backend nem autenticação. Persistência em `localStorage`.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Arquitetura](#arquitetura)
- [Componentes Core](#componentes-core)
- [Tipos de Input Suportados](#tipos-de-input-suportados)
- [Grid Layout](#grid-layout)
- [Persistência](#persistência)
- [Schema do JSON Exportado](#schema-do-json-exportado)
- [Testes](#testes)
- [Roadmap](#roadmap)

---

## Visão Geral

| Característica | Detalhe |
|---|---|
| Tipo | SPA (Single Page Application) |
| Renderização | CSR via Vite + React 18 |
| Linguagem | TypeScript (`strict: true`) |
| Estilização | Tailwind CSS |
| Estado | Zustand + middleware `persist` |
| Validação | Zod (schemas como fonte única de verdade) |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Cobertura mínima | 80% statements/branches/functions/lines |

**Fluxo principal:**

1. Usuário arrasta um input da **paleta** (left panel) para o **canvas** (center).
2. Clica em um campo para abrir o **painel de propriedades** (right panel).
3. Edita props (validadas por Zod em tempo real).
4. Exporta o formulário como JSON ou importa um JSON existente.
5. O rascunho é persistido automaticamente no `localStorage`.

---

## Stack

| Camada | Lib | Versão |
|---|---|---|
| Build / Dev | Vite | ^5.4.8 |
| UI | React | ^18.3.1 |
| Linguagem | TypeScript | ^5.6.2 |
| DnD | @dnd-kit/core, @dnd-kit/sortable | ^6.1, ^8.0 |
| Estado | zustand | ^4.5.5 |
| Validação | zod | ^3.23.8 |
| Estilo | tailwindcss | ^3.4.13 |
| Utilitários | nanoid, clsx | ^5.0.7, ^2.1.1 |
| Testes | vitest, @testing-library/react | ^2.1.2, ^16.0.1 |
| Package Manager | **pnpm** (obrigatório) | ^10.23.0 |

---

## Pré-requisitos

- **Node.js** >= 18.x
- **pnpm** >= 10.23.0 (definido em `packageManager`)
- **Git** (com suporte a submodules, pois `populis-v3-core` é referência)

> **Por que pnpm?** A migração para pnpm está documentada no commit `8cf370d`. Usa `node_modules/.pnpm/` para isolamento e economia de disco.

---

## Instalação

```bash
# 1. Clonar com submódulos (a populis-v3-core é referência de mapeamento)
git clone --recurse-submodules <repo-url>
cd form-builder

# Se já clonou sem --recurse-submodules:
git submodule update --init --recursive

# 2. Instalar dependências
pnpm install

# 3. Rodar em modo dev
pnpm dev
# → abre em http://localhost:5173
```

---

## Scripts Disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `vite` | Inicia o servidor de desenvolvimento (porta 5173) |
| `build` | `tsc -b && vite build` | Build de produção (type-check + bundle) |
| `preview` | `vite preview` | Serve o build de produção localmente |
| `test` | `vitest run` | Roda a suite completa de testes |
| `test:watch` | `vitest` | Modo watch para TDD |
| `test:coverage` | `vitest run --coverage` | Relatório de cobertura (HTML em `coverage/`) |
| `lint` | `tsc --noEmit` | Type-check sem emitir arquivos |

---

## Estrutura do Projeto

```
form-builder/
├── .claude/                       # Configuração ECC + planos
│   └── plans/
│       └── form-builder.plan-v2.md   # ⭐ Mapeamento de fases e decisões
├── populis-v3-core/               # Submódulo git — referência de tipos V3
├── src/
│   ├── main.tsx                   # Bootstrap React (StrictMode)
│   ├── App.tsx                    # Renderiza <AppShell />
│   ├── index.css                  # Diretivas Tailwind
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # 3 colunas + DndContext global
│   │   │   ├── Toolbar.tsx        # Importar / Exportar / Limpar
│   │   │   ├── LeftPanel.tsx      # Paleta agrupada por categoria
│   │   │   ├── CanvasPanel.tsx    # Grid 12 col + SortableContext
│   │   │   └── PropsPanel.tsx     # Editor de props do campo selecionado
│   │   ├── dnd/
│   │   │   ├── DraggableInput.tsx     # Item da paleta (source: 'palette')
│   │   │   ├── SortableFormItem.tsx   # Item do canvas (source: 'canvas')
│   │   │   └── DragOverlayCard.tsx    # Preview visual durante drag
│   │   ├── inputs/
│   │   │   ├── InputPreview.tsx       # Preview unificado por type
│   │   │   └── registry.ts            # type → { label, category, defaults }
│   │   └── props/
│   │       ├── PropEditor.tsx         # Renderiza editores dinamicamente
│   │       └── editors/
│   │           ├── StringEditor.tsx
│   │           ├── BooleanEditor.tsx
│   │           └── JsonEditor.tsx
│   │
│   ├── store/
│   │   └── formStore.ts           # Zustand + persist (versão 2)
│   │
│   ├── schemas/                   # ⭐ Fonte de verdade dos tipos
│   │   ├── base.schema.ts         # BaseInputPropsSchema (18 props)
│   │   ├── inputs.schema.ts       # Discriminated union de 32 tipos
│   │   └── form.schema.ts         # Raiz do JSON exportado
│   │
│   ├── utils/
│   │   ├── exportForm.ts          # Serializa + valida + download
│   │   ├── importForm.ts          # Parse + valida JSON externo
│   │   └── gridClass.ts           # colSpan numérico → classe Tailwind
│   │
│   ├── types/
│   │   └── index.ts               # Re-exporta tipos inferidos de Zod
│   │
│   └── __tests__/                 # Espelha estrutura de src/
│       ├── setup.ts
│       ├── components/
│       ├── schemas/
│       ├── store/
│       └── utils/
│
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json                  # Project references
├── tsconfig.app.json              # App (src/)
├── tsconfig.node.json             # Configs (vite, vitest)
├── vite.config.ts                 # Alias @/ → src/
└── vitest.config.ts               # jsdom + coverage thresholds 80%
```

---

## Arquitetura

### Diagrama de alto nível

```
┌──────────────────────────────────────────────────────────────┐
│                          Toolbar                             │
│        [Importar]  [Exportar JSON]  [Limpar]  [status]       │
├────────────────┬────────────────────────────┬────────────────┤
│                │                            │                │
│   LeftPanel    │       CanvasPanel          │  PropsPanel    │
│   (Paleta)     │   (Grid 12 colunas)        │  (Editor)      │
│                │                            │                │
│   Texto >      │   ┌──────────────────────┐ │  name: ___     │
│    • Texto     │   │ [InputText col-12]   │ │  label: ___    │
│    • Email     │   │ [InputDate col-6]    │ │  required:[ ]  │
│   Numérico >   │   │ [InputCpf  col-6]    │ │  colSpan: [12] │
│   Data/Hora >  │   └──────────────────────┘ │                │
│   ...          │                            │  [Excluir]     │
└────────────────┴────────────────────────────┴────────────────┘
                          ▲
                          │
                   ┌──────┴──────┐
                   │ Zustand     │  formStore.ts
                   │ + persist   │  (localStorage)
                   └─────────────┘
                          ▲
                          │
                   ┌──────┴──────┐
                   │  Zod        │  schemas/*.ts
                   │ (fonte de   │  (BaseInput + 32 tipos)
                   │  verdade)   │
                   └─────────────┘
```

### Fluxo de dados

```
[Paleta] --drag--> [Canvas]
   │                   │
   ▼                   ▼
addField(type)    selectField(id) ──► [PropsPanel] ──► updateField(id, patch)
   │                                                            │
   └───────────────► useFormStore (Zustand) ◄───────────────────┘
                            │
                            ├── persist (auto-save) ──► localStorage
                            │
                            └── exportJSON() ──► Zod validate ──► download
```

### Camadas

1. **`schemas/`** — Fonte de verdade. Cada tipo de input tem um Zod schema; tipos TS são inferidos via `z.infer`. Validação acontece em 5 pontos: edição de props, export, import, rehidratação do storage e ao adicionar campo.

2. **`store/formStore.ts`** — Zustand com middleware `persist`. Persiste apenas `{ formId, createdAt, updatedAt, fields }` (sem flags de UI). `version: 2` com migration de v1 (adiciona `colSpan: 12`). No `merge`, cada field é validado individualmente — se algum falha, descarta tudo e reseta.

3. **`components/`** — Camada visual. Componentes consomem **slices** via seletores Zustand (`useFormStore((s) => s.fields)`) para minimizar re-renders.

4. **`utils/`** — Funções puras (export, import, grid class). Sem dependência de React.

---

## Componentes Core

A aplicação gira em torno de **três componentes principais** que cooperam dentro de um único `DndContext` em [AppShell.tsx](src/components/layout/AppShell.tsx). Eles formam o tripé visual e funcional do builder.

```
┌──────────────┬──────────────────────────┬──────────────┐
│              │                          │              │
│  ① Paleta    │      ② Canvas            │  ③ Editor    │
│  LeftPanel   │      CanvasPanel         │  PropsPanel  │
│              │                          │              │
│  Origem do   │  Composição visual do    │  Edição das  │
│  drag        │  formulário              │  propriedades│
│              │                          │              │
└──────────────┴──────────────────────────┴──────────────┘
       │                 ▲                       ▲
       │ addField()      │ updateField()         │ selectField()
       └────────────────►│◄──────────────────────┘
                  formStore (Zustand)
```

### ① Paleta de Componentes — [LeftPanel.tsx](src/components/layout/LeftPanel.tsx)

**Responsabilidade:** expor todos os tipos de input disponíveis, agrupados por categoria, prontos para serem arrastados.

| Aspecto | Detalhe |
|---|---|
| Fonte de dados | `listByCategory()` de [registry.ts](src/components/inputs/registry.ts) |
| Item drag-source | [DraggableInput.tsx](src/components/dnd/DraggableInput.tsx) — usa `useDraggable` com `data: { source: 'palette', type }` |
| Agrupamento | 10 categorias colapsáveis (Texto, Numérico, Data/Hora, Documentos BR, …) |
| Estado local | `open: Record<category, boolean>` para expandir/colapsar |

**Como ele participa do fluxo:**

1. Usuário inicia drag em um `DraggableInput` → `active.data.current = { source: 'palette', type }`.
2. `AppShell.onDragEnd` detecta `source === 'palette'` e chama `addField(type)` no store.
3. O Canvas re-renderiza com o novo campo.

> **Não armazena estado do formulário.** A paleta é puramente uma fonte de "templates" — quem materializa o campo (com `id`, `colSpan: 12` e `defaultProps`) é o `formStore.addField`.

---

### ② Canvas / Formulário — [CanvasPanel.tsx](src/components/layout/CanvasPanel.tsx)

**Responsabilidade:** renderizar o formulário em construção como uma grid 12 colunas, aceitar drops da paleta, permitir reordenação interna e seleção de campos.

| Aspecto | Detalhe |
|---|---|
| Drop zone | `useDroppable({ id: 'canvas-droppable' })` |
| Sortable context | `SortableContext` com `rectSortingStrategy` (grid 2D) |
| Layout | `grid grid-cols-12 gap-3` (Tailwind) |
| Item renderizado | [SortableFormItem.tsx](src/components/dnd/SortableFormItem.tsx) — `memo()` para evitar re-render em cascata |
| Preview do campo | [InputPreview.tsx](src/components/inputs/InputPreview.tsx) — representação visual simplificada por tipo |
| Overlay durante drag | [DragOverlayCard.tsx](src/components/dnd/DragOverlayCard.tsx) |

**Estados visuais:**

- **Vazio:** placeholder "Arraste inputs aqui para construir o formulario"
- **`isOver`:** borda azul sólida + fundo azul claro (feedback de drop)
- **Item selecionado:** `border-blue-500 ring-2 ring-blue-200` no `SortableFormItem`
- **Item sendo arrastado:** `invisible` (DragOverlay assume a representação)

**Interações suportadas:**

| Ação | Handler | Efeito |
|---|---|---|
| Drop da paleta no canvas vazio | `AppShell.onDragEnd` | `addField(type)` no final |
| Drop da paleta sobre outro campo | `AppShell.onDragEnd` | `addField(type, idx)` na posição |
| Drag de campo existente para outra posição | `AppShell.onDragEnd` | `reorderByIndex(old, new)` |
| Click no campo | `SortableFormItem.onClick` | `selectField(id)` — abre PropsPanel |
| Click no ✕ (hover) | `onRemove` | `removeField(id)` |
| Click no handle ⋮⋮ | `useSortable.listeners` | inicia drag interno |

> **Discriminação paleta vs. canvas:** ambos compartilham o mesmo `DndContext`. A diferenciação acontece via `active.data.current.source` (`'palette'` cria, `'canvas'` reordena).

---

### ③ Editor de Propriedades — [PropsPanel.tsx](src/components/layout/PropsPanel.tsx)

**Responsabilidade:** editar dinamicamente as props do campo selecionado, com editores específicos por tipo de dado.

| Aspecto | Detalhe |
|---|---|
| Visibilidade | Só aparece quando `selectedFieldId !== null` |
| Orquestrador | [PropEditor.tsx](src/components/props/PropEditor.tsx) — separa props em 5 seções |
| Editores primitivos | [StringEditor](src/components/props/editors/StringEditor.tsx), [BooleanEditor](src/components/props/editors/BooleanEditor.tsx), [JsonEditor](src/components/props/editors/JsonEditor.tsx) |
| Detecção de tipo | `listSpecificProps()` infere `kind` por `typeof` (string/number/boolean/json) |
| Atualização | Cada onChange dispara `updateField(id, { [key]: value })` — re-render imediato no Canvas |

**Seções do editor (na ordem):**

1. **Identificação** — `name` *(obrigatório, com erro inline)*, `label`, `placeholder`
2. **Texto/Hint** — `hint`, `min`, `max`, `customRequiredWarning`, `labelClass`
3. **Comportamento** — booleanos da base: `required`, `readonly`, `showCaracterCounter`, `highlight`, `doNotTranslate`, `requestFocus`
4. **Específicas** — props únicas do tipo (ex: `mask` para `input-mask`, `source` para selects), com editor escolhido por `kind`
5. **Wrapper (BaseControl)** — `colSpan` (select 1-12), `class`, `hide`

**Loop de feedback:**

```
PropsPanel  ──updateField()──►  formStore  ──notify──►  CanvasPanel
     ▲                                                       │
     └──────────────── selectField(id) ──────────────────────┘
```

> **Validação:** props passam por `BaseInputPropsSchema` / `FieldSchema` na hora do **export** (não a cada keystroke — UX mais fluida). Mensagens inline cobrem casos críticos como `name` vazio.

---

### Resumo da divisão de responsabilidades

| Componente | Lê do store | Escreve no store | DnD role |
|---|---|---|---|
| **Paleta** | — (usa registry estático) | — | drag-source |
| **Canvas** | `fields`, `selectedFieldId` | `selectField`, `removeField` (e via DnD: `addField`, `reorderByIndex`) | drop-target + sortable |
| **Editor** | `fields.find(selectedFieldId)` | `updateField`, `updateFieldMeta`, `removeField` | — |

Os três se comunicam **exclusivamente via Zustand store** — não há props drilling nem contexto compartilhado entre eles. Isso permite testá-los isoladamente (ver [`src/__tests__/components/`](src/__tests__/components/)).

---

## Tipos de Input Suportados

**25 tipos** organizados em 8 categorias (mapeamento completo da `populis-v3-core`):

| Categoria | Tipos |
|---|---|
| **Texto** | `input-text`, `input-textarea`, `input-email`, `input-password`, `input-phone` |
| **Numérico** | `input-number`, `input-decimal`, `input-money` |
| **Data/Hora** | `input-date`, `input-time` |
| **Documentos BR** | `input-cpf`, `input-cnpj`, `input-rg`, `input-pis` |
| **Avançado** | `input-mask`, `input-color`, `input-json`, `input-ocr`, `input-report` |
| **Upload** | `input-attach` |
| **Modal/Lookup** | `input-modal`, `input-cep-modal` |
| **Seleção** | `select-multiple`, `select-search`, `dynamic-select` |

### Props base (herdadas por todos)

Espelha `InputBaseComponent` + `BaseControl` da V3:

`name` *(obrigatório)*, `label`, `placeholder`, `required`, `readonly`, `hint`, `min`, `max`, `showCaracterCounter`, `highlight`, `doNotTranslate`, `customRequiredWarning`, `value`, `labelClass`, `requestFocus`, `keyboardOptions`, `class`, `hide`, `colSpan`.

> Cada tipo também tem props específicas — ex: `input-money` tem `minValue`/`maxValue`, `input-mask` tem `mask`/`clearSpecialCharacter`, selects têm `source: Array<{key, value}>`.

---

## Grid Layout

O canvas usa **CSS Grid 12 colunas** (`grid-cols-12 gap-3`). Cada campo tem uma prop `colSpan` (1-12) que controla quantas colunas ocupa.

```ts
// src/utils/gridClass.ts
colSpanClass(1)  // → "col-span-1"
colSpanClass(6)  // → "col-span-6"
colSpanClass(12) // → "col-span-12"  (default)
```

**Exemplo:** dois campos lado a lado:

```json
{ "type": "input-cpf",  "colSpan": 6, ... }
{ "type": "input-rg",   "colSpan": 6, ... }
```

> Migração de "standard rows" → Grid foi feita no commit `12a5f33`.

---

## Persistência

- **Chave do storage:** `form-builder:draft`
- **Versão atual:** `2` (auto-migra de v1 adicionando `colSpan: 12` aos fields existentes)
- **Auto-save:** transparente via middleware `persist` do Zustand
- **Defesa contra corrupção:** ao rehidratar, cada field passa por `FieldSchema.safeParse`. Se algum falha → remove a chave e inicia limpo
- **Limite prático:** ~5MB (formulários típicos < 100KB)

**Botão "Limpar"** zera o estado E remove a chave do localStorage.

---

## Schema do JSON Exportado

```json
{
  "schemaVersion": 1,
  "formId": "nanoid",
  "createdAt": "2026-06-09T10:00:00Z",
  "updatedAt": "2026-06-09T10:42:00Z",
  "fields": [
    {
      "id": "nanoid",
      "type": "input-text",
      "class": "",
      "hide": false,
      "colSpan": 12,
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

**Compatibilidade V3:** `class`, `hide`, `type`, `props` espelham `BaseControl` da `populis-v3-core` para consumo direto no futuro. O campo `id` é metadado do builder e pode ser ignorado.

### Exportar

Toolbar → **Exportar JSON**:
1. Roda `FormSchema.safeParse(state)` — bloqueia se inválido
2. Copia para clipboard
3. Faz download de `form.json`

### Importar

Toolbar → **Importar**:
1. Upload de `.json` OU paste em textarea
2. `FormSchema.safeParse(parsed)` — erros formatados se falhar
3. Confirma antes de sobrescrever rascunho atual

---

## Testes

```bash
pnpm test                # Roda toda a suite
pnpm test:watch          # Modo TDD
pnpm test:coverage       # Gera relatório em coverage/
```

**Cobertura:** suite organizada em camadas (commit `91ff7b5`):

| Camada | Tipo | Arquivo |
|---|---|---|
| Schemas Zod | Unit | `__tests__/schemas/inputs.test.ts`, `registry.test.ts` |
| Store | Unit | `__tests__/store/formStore.test.ts`, `persist.test.ts` |
| Utils | Unit | `__tests__/utils/exportImport.test.ts`, `gridClass.test.ts` |
| Canvas | Integration | `__tests__/components/CanvasPanel.test.tsx` |
| Props | Integration | `__tests__/components/PropsPanel.test.tsx` |
| Toolbar | Integration | `__tests__/components/Toolbar.test.tsx` |

**Thresholds (`vitest.config.ts`):** statements 80% / branches 80% / functions 80% / lines 80%.

---

## Roadmap

### v2+ (Fora de Escopo Atual)

- [ ] Múltiplos formulários (lista + CRUD local)
- [ ] Integração API (persistência remota, versionamento)
- [ ] Autenticação + multi-tenant
- [ ] Acessibilidade WCAG 2.2 AA (`KeyboardSensor` do @dnd-kit, ARIA, foco gerenciado)
- [ ] Histórico undo/redo
- [ ] Templates reutilizáveis
- [ ] Renderer V3 (gerar tags `<input-text>` da V3 a partir do JSON)
- [ ] Validação avançada (regex, dependências entre campos)
- [ ] i18n do próprio builder

---

## Referências

- [Plano de implementação completo (v2)](.claude/plans/form-builder.plan-v2.md) — fases, decisões, riscos e critérios de aceite
- [populis-v3-core](populis-v3-core/) — submódulo com a fonte de verdade dos tipos de input
