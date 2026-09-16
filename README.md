# Form Builder

Editor visual de formulários em **React + TypeScript**. Arraste inputs da paleta para um canvas central, edite propriedades no painel lateral e exporte o formulário já no formato consumido pela `populis-v3-core` (`IFormSourceItem[]`).

> **Versão atual:** v1 — 100% client-side, sem backend nem autenticação. Persistência do rascunho em `localStorage`.

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
- [Tema (Claro/Escuro)](#tema-claroescuro)
- [UI Kit e Diálogos](#ui-kit-e-diálogos)
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
| Estilização | Tailwind CSS + tokens CSS (suporte a tema claro/escuro) |
| Estado | Zustand (`formStore` com `persist`, `dialogStore`, `fieldPickerStore`, `toastStore`) |
| Validação | Zod (schemas como fonte única de verdade) |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable`, com colisão e reorder customizados |
| Cobertura mínima | 80% statements/branches/functions/lines |

**Fluxo principal:**

1. Usuário arrasta um input da **paleta** (left panel) para o **canvas** (center).
2. Clica em um campo para abrir o **painel de propriedades** (right panel).
3. Edita props (validadas por Zod em tempo real).
4. Exporta o formulário como JSON (formato `IFormSourceItem[]`, direto para a v3) ou importa um JSON existente.
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
| Utilitários | clsx | ^2.1.1 |
| Lint/Format | @biomejs/biome | 2.4.16 (config em `biome.json`; ainda não plugado em um script `pnpm`) |
| Testes | vitest, @testing-library/react | ^2.1.2, ^16.0.1 |
| Package Manager | **pnpm** (obrigatório) | ^10.23.0 |

> Ids internos (`field.id`, `formId`) são gerados por [`utils/id.ts`](src/utils/id.ts) via `crypto.randomUUID()` (com fallback manual), sem dependência externa.

---

## Pré-requisitos

- **Node.js** >= 18.x
- **pnpm** >= 10.23.0 (definido em `packageManager`)

> **Por que pnpm?** A migração para pnpm está documentada no commit `8cf370d`. Usa `node_modules/.pnpm/` para isolamento e economia de disco.

---

## Instalação

```bash
git clone <repo-url>
cd form-builder

# 1. Instalar dependências
pnpm install

# 2. Rodar em modo dev
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

> Não há script `pnpm biome ...` no `package.json` — para lintar/formatar com Biome hoje é preciso rodar `pnpm biome check .` (ou `--write`) diretamente, ou usar a extensão da IDE.

**CI** (`.github/workflows/ci.yml`): em push/PR para `main`, roda `pnpm install --frozen-lockfile` seguido de `pnpm test` em Node 24. Não roda `lint`, `build` nem Biome.

---

## Estrutura do Projeto

```
form-builder/
├── .claude/                        # Configuração ECC + histórico de planos (.claude/plans/*.md)
├── .github/workflows/ci.yml        # CI: install + testes em push/PR para main
├── docs/
│   └── v3-props-gaps.md            # Lacunas de props entre o builder e a v3 (ver Tipos de Input)
├── src/
│   ├── main.tsx                    # Bootstrap React (StrictMode)
│   ├── App.tsx                     # Renderiza <AppShell />
│   ├── index.css                   # Diretivas Tailwind + tokens CSS de tema
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # DndContext global + colisão/reorder customizados
│   │   │   ├── Toolbar.tsx         # Importar / Exportar / Limpar / alternar tema
│   │   │   ├── LeftPanel.tsx       # Paleta agrupada por categoria (via categories.ts)
│   │   │   ├── CanvasPanel.tsx     # Grid 12 col + SortableContext
│   │   │   └── PropsPanel.tsx      # Wrapper fino sobre PropEditor
│   │   ├── dnd/
│   │   │   ├── DraggableInput.tsx     # Item da paleta (source: 'palette')
│   │   │   ├── SortableFormItem.tsx   # Item do canvas (source: 'canvas'), memo()
│   │   │   ├── DragOverlayCard.tsx    # Preview visual durante drag
│   │   │   └── canvasCollision.ts     # CollisionDetection custom p/ drop sobre cards
│   │   ├── inputs/
│   │   │   ├── InputPreview.tsx       # Preview unificado por type
│   │   │   ├── registry.ts            # type → { label, category, defaultProps }
│   │   │   └── categories.ts          # ⭐ fonte única das 8 categorias (label + ícone)
│   │   ├── icons/
│   │   │   └── Icon.tsx               # Ícones SVG vendorizados (estilo Lucide, sem lib externa)
│   │   ├── ui/
│   │   │   ├── Button.tsx             # Variantes primary/secondary/danger/ghost/icon
│   │   │   ├── AlertDialog.tsx        # Host do confirm() imperativo (dialogStore)
│   │   │   ├── FieldPickerDialog.tsx  # Host do pickField() imperativo (fieldPickerStore)
│   │   │   └── Toast.tsx              # Host do toast() imperativo (toastStore)
│   │   └── props/
│   │       ├── PropEditor.tsx         # Orquestra as seções do editor por campo
│   │       ├── specificEditors.tsx    # Escolhe editor por nome de prop, depois por tipo de valor
│   │       └── editors/
│   │           ├── StringEditor.tsx
│   │           ├── BooleanEditor.tsx
│   │           ├── JsonEditor.tsx
│   │           ├── SourceEditor.tsx        # listas { key, value } ou { label, value }
│   │           ├── FieldsEditor.tsx        # dynamic-select.fields ({ key, value })
│   │           └── RedirectFieldsEditor.tsx # usa FieldPickerDialog p/ escolher campos
│   │
│   ├── hooks/
│   │   └── useTheme.ts             # Tema claro/escuro (localStorage + prefers-color-scheme)
│   │
│   ├── store/
│   │   ├── formStore.ts            # Zustand + persist (versão 2)
│   │   ├── dialogStore.ts          # confirm() imperativo — substitui window.confirm
│   │   ├── fieldPickerStore.ts     # pickField() imperativo
│   │   └── toastStore.ts           # toast() imperativo — fila de notificações
│   │
│   ├── schemas/                    # ⭐ Fonte de verdade dos tipos
│   │   ├── base.schema.ts          # BaseInputPropsSchema (16 props)
│   │   ├── inputs.schema.ts        # Discriminated union de 28 tipos + wrap() (id/class/hide/colSpan)
│   │   └── form.schema.ts          # Payload interno do builder (usado como backup/restore)
│   │
│   ├── utils/
│   │   ├── exportForm.ts           # Converte p/ IFormSourceItem[] + valida + clipboard + download
│   │   ├── importForm.ts           # Aceita IFormSourceItem[] (v3) OU o payload interno
│   │   ├── gridClass.ts            # colSpan numérico → classe Tailwind
│   │   └── id.ts                   # generateId() via crypto.randomUUID, sem libs externas
│   │
│   ├── types/
│   │   ├── index.ts                # Re-exporta tipos inferidos de Zod
│   │   └── formSourceItem.ts        # Espelho local de IFormSourceItem da v3
│   │
│   └── __tests__/                  # Espelha estrutura de src/ (24 arquivos de teste)
│
├── index.html
├── package.json
├── pnpm-lock.yaml
├── biome.json                      # Lint/format (Biome) — ver nota em Scripts
├── tailwind.config.js              # Paleta via tokens CSS (--background, --primary, ...) + darkMode: "class"
├── postcss.config.js
├── tsconfig.json                   # Project references
├── tsconfig.app.json               # App (src/)
├── tsconfig.node.json              # Configs (vite)
└── vite.config.ts                  # Alias @/ → src/, plugins + config do vitest (embutida)
```

---

## Arquitetura

### Diagrama de alto nível

```
┌──────────────────────────────────────────────────────────────┐
│                          Toolbar                             │
│  [Importar]  [Exportar JSON]  [Limpar]  [status]  [🌙/☀️]    │
├────────────────┬────────────────────────────┬────────────────┤
│                │                            │                │
│   LeftPanel    │       CanvasPanel          │  PropsPanel    │
│   (Paleta)     │   (Grid 12 colunas)        │  (Editor)      │
│                │                            │                │
│   Texto >      │   ┌──────────────────────┐ │  name: ___     │
│    • Texto     │   │ [InputText col-6]    │ │  label: ___    │
│    • Email     │   │ [InputDate col-6]    │ │  colSpan: [6]  │
│   Numérico >   │   │ [InputCpf  col-6]    │ │  required:[ ]  │
│   ...          │   └──────────────────────┘ │  [Excluir]     │
└────────────────┴────────────────────────────┴────────────────┘
                          ▲
                          │
                   ┌──────┴──────┐
                   │ Zustand     │  formStore.ts (persist) / dialogStore / fieldPickerStore
                   └─────────────┘
                          ▲
                          │
                   ┌──────┴──────┐
                   │  Zod        │  schemas/*.ts
                   │ (fonte de   │  (BaseInputPropsSchema + 28 tipos)
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
                            └── exportJSON() ──► valida (Zod + entity) ──► toV3SourceList() ──► clipboard + download
```

### Camadas

1. **`schemas/`** — Fonte de verdade. Cada tipo de input tem um Zod schema; tipos TS são inferidos via `z.infer`. Validação acontece em vários pontos: edição de props, export, import, rehidratação do storage e ao adicionar campo.

2. **`store/formStore.ts`** — Zustand com middleware `persist`. Persiste apenas `{ formId, createdAt, updatedAt, fields }` (sem flags de UI). `version: 2`, com migration de v1 (backfill de `colSpan: 12` em fields antigos sem a prop). No `merge`, cada field é validado individualmente — se algum falha, descarta tudo e reseta. `dialogStore` e `fieldPickerStore` são stores Zustand independentes, sem `persist`, que expõem APIs imperativas (`confirm()`, `pickField()`) resolvidas por Promise. `toastStore` segue o mesmo padrão imperativo (`toast()`), mas sem Promise: é fire-and-forget e mantém uma fila de notificações.

3. **`components/`** — Camada visual. Componentes consomem **slices** via seletores Zustand (`useFormStore((s) => s.fields)`) para minimizar re-renders.

4. **`utils/`** — Funções puras (export, import, grid class, geração de id). Sem dependência de React.

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
| Fonte da categoria | [categories.ts](src/components/inputs/categories.ts) — label + ícone por `CategoryId`, usado por `registry.ts` e `LeftPanel.tsx` |
| Item drag-source | [DraggableInput.tsx](src/components/dnd/DraggableInput.tsx) — usa `useDraggable` com `data: { source: 'palette', type }` |
| Agrupamento | **8 categorias** colapsáveis (Texto, Numérico, Data/Hora, Documentos BR, Avançado, Upload, Modal/Lookup, Seleção) |
| Estado local | `open: Record<category, boolean>` para expandir/colapsar |

**Como ele participa do fluxo:**

1. Usuário inicia drag em um `DraggableInput` → `active.data.current = { source: 'palette', type }`.
2. `AppShell.onDragEnd` detecta `source === 'palette'` e chama `addField(type)` no store.
3. O Canvas re-renderiza com o novo campo.

> **Não armazena estado do formulário.** A paleta é puramente uma fonte de "templates" — quem materializa o campo (com `id`, `colSpan: 6` e `defaultProps`) é o `formStore.addField`.

---

### ② Canvas / Formulário — [CanvasPanel.tsx](src/components/layout/CanvasPanel.tsx)

**Responsabilidade:** renderizar o formulário em construção como uma grid 12 colunas, aceitar drops da paleta, permitir reordenação interna e seleção de campos.

| Aspecto | Detalhe |
|---|---|
| Drop zone | `useDroppable({ id: 'canvas-droppable' })` |
| Sortable context | `SortableContext` com estratégia de projeção nula (`noProjectionStrategy`) |
| Colisão | [canvasCollision.ts](src/components/dnd/canvasCollision.ts) — prioriza o card sob o ponteiro (`pointerWithin`) e só aceita o container do canvas quando nenhum card colide |
| Layout | `grid grid-cols-12 gap-3` (Tailwind) |
| Item renderizado | [SortableFormItem.tsx](src/components/dnd/SortableFormItem.tsx) — `memo()`; também focável/selecionável via teclado (`role="button"`, Enter/Espaço) |
| Preview do campo | [InputPreview.tsx](src/components/inputs/InputPreview.tsx) — representação visual simplificada por tipo |
| Overlay durante drag | [DragOverlayCard.tsx](src/components/dnd/DragOverlayCard.tsx) |

> **Por que projeção nula?** A `rectSortingStrategy` padrão do dnd-kit assume itens de tamanho igual. Com `colSpan` variável por campo, o reflow real do grid (disparado a cada `onDragOver`) já entrega o preview correto — a projeção da lib apenas distorceria os cards.

**Estados visuais:**

- **Vazio:** placeholder "Arraste inputs aqui para construir o formulario"
- **`isOver`:** borda azul sólida + fundo azul claro (feedback de drop)
- **Item selecionado:** anel de foco (`ring-2`) no `SortableFormItem`
- **Item sendo arrastado:** `invisible` (DragOverlay assume a representação)

**Interações suportadas:**

| Ação | Handler | Efeito |
|---|---|---|
| Drop da paleta no canvas vazio | `AppShell.onDragEnd` | `addField(type)` no final |
| Drop da paleta sobre outro campo | `AppShell.onDragEnd` | `addField(type, idx)` na posição |
| Arrastar campo existente | `AppShell.onDragOver` (ao vivo) | `reorderByIndex(old, new)` a cada troca de posição sob o ponteiro |
| Click/Enter/Espaço no campo | `SortableFormItem` | `selectField(id)` — abre PropsPanel |
| Click no ✕ (hover/foco) | `onRemove` | Abre diálogo de confirmação → `removeField(id)` |
| Click no handle ⋮⋮ | `useSortable.listeners` | inicia drag interno |

> **Discriminação paleta vs. canvas:** ambos compartilham o mesmo `DndContext`. A diferenciação acontece via `active.data.current.source` (`'palette'` cria, `'canvas'` reordena).

---

### ③ Editor de Propriedades — [PropsPanel.tsx](src/components/layout/PropsPanel.tsx)

**Responsabilidade:** editar dinamicamente as props do campo selecionado, com editores específicos por tipo de dado.

| Aspecto | Detalhe |
|---|---|
| Visibilidade | Só aparece quando `selectedFieldId !== null` |
| Orquestrador | [PropEditor.tsx](src/components/props/PropEditor.tsx) |
| Escolha de editor | [specificEditors.tsx](src/components/props/specificEditors.tsx) — primeiro por **nome da prop** (`source`, `fields`, `redirectFields`, `entity`), depois por **tipo do valor** (`boolean`/`number`/`json`/`string`) como fallback |
| Editores | [StringEditor](src/components/props/editors/StringEditor.tsx), [BooleanEditor](src/components/props/editors/BooleanEditor.tsx), [JsonEditor](src/components/props/editors/JsonEditor.tsx), [SourceEditor](src/components/props/editors/SourceEditor.tsx), [FieldsEditor](src/components/props/editors/FieldsEditor.tsx), [RedirectFieldsEditor](src/components/props/editors/RedirectFieldsEditor.tsx) |
| Atualização | Cada onChange dispara `updateField(id, { [key]: value })` — re-render imediato no Canvas |

**Seções do editor (campos normais, na ordem):**

1. **Identificação / Texto-Hint** — `name` *(obrigatório, com erro inline)*, `label`, `placeholder`, `hint`, `min`, `max`, `customRequiredWarning`, `labelClass`
2. **Diretivas Base (BaseControl)** — `colSpan` (select 1-12, rótulo "Largura"), `class`, `hide`
3. **Comportamento** — booleanos da base: `required`, `readonly`, `showCaracterCounter`, `highlight`, `doNotTranslate`, `requestFocus`
4. **Específicas do Input** — props únicas do tipo, roteadas por `specificEditors.tsx` (ex: `source` para selects/radio, `mask` para `input-mask`, `entity` obrigatória para `input-modal`/`dynamic-select`, `redirectFields` com seletor de campo via diálogo)

`divider-component` não é um input real na v3 (estende `BaseComponent`, não `InputBaseComponent`): seu editor pula direto para **Diretivas Base** e uma seção própria de **Divisória** (`name`, `label`, `labelClass`, `fontSize`, `transformDivider`, `doNotTranslate`).

**Loop de feedback:**

```
PropsPanel  ──updateField()──►  formStore  ──notify──►  CanvasPanel
     ▲                                                       │
     └──────────────── selectField(id) ──────────────────────┘
```

> **Validação:** props passam pelo `FieldSchema` na hora do **export** (não a cada keystroke — UX mais fluida). Mensagens inline cobrem casos críticos: `name` vazio e `entity` vazia em `input-modal`/`dynamic-select`.

---

### Resumo da divisão de responsabilidades

| Componente | Lê do store | Escreve no store | DnD role |
|---|---|---|---|
| **Paleta** | — (usa registry/categories estáticos) | — | drag-source |
| **Canvas** | `fields`, `selectedFieldId` | `selectField`, `removeField` (e via DnD: `addField`, `reorderByIndex`) | drop-target + sortable |
| **Editor** | `fields.find(selectedFieldId)` | `updateField`, `updateFieldMeta`, `removeField` | — |

Os três se comunicam **exclusivamente via Zustand store** — não há props drilling nem contexto compartilhado entre eles. Isso permite testá-los isoladamente (ver [`src/__tests__/components/`](src/__tests__/components/)).

---

## Tema (Claro/Escuro)

- [`useTheme.ts`](src/hooks/useTheme.ts) resolve o tema inicial na ordem: `localStorage` (`form-builder-theme`) → `prefers-color-scheme: dark` → `light`.
- O botão ☀️/🌙 na Toolbar alterna o tema, aplicando/removendo a classe `.dark` na raiz do documento (`tailwind.config.js` usa `darkMode: "class"`).
- As cores são tokens CSS (ex.: `--background`, `--foreground`, `--primary`) mapeados no Tailwind; os componentes usam classes semânticas (`bg-card`, `text-foreground`, `border-edge`) em vez de cores fixas, então funcionam nos dois temas sem duplicar classes.
- A preferência de tema é independente do rascunho do formulário: tem chave própria no `localStorage` e não passa pelo `persist` do `formStore` (não é migrada nem versionada junto com os fields).

---

## UI Kit e Diálogos

- [`ui/Button.tsx`](src/components/ui/Button.tsx) — variantes (`primary`/`secondary`/`danger`/`danger-solid`/`ghost`) e tamanhos (`sm`/`icon`/default), usado em toda a aplicação.
- [`ui/AlertDialog.tsx`](src/components/ui/AlertDialog.tsx) + [`store/dialogStore.ts`](src/store/dialogStore.ts) — substitui `window.confirm`. `confirm({ title, description, variant })` retorna uma `Promise<boolean>`; o diálogo é montado uma única vez (portal), com focus-trap, `role="dialog"`/`aria-modal`, `Esc` cancela e o foco é restaurado ao fechar. Usado ao excluir um campo, importar sobre um rascunho não vazio e limpar o formulário.
- [`ui/FieldPickerDialog.tsx`](src/components/ui/FieldPickerDialog.tsx) + [`store/fieldPickerStore.ts`](src/store/fieldPickerStore.ts) — modal de busca (`pickField()`, mesmo padrão de Promise e acessibilidade) para escolher outro campo do formulário por `name`/`label`/tipo; usado pelo `RedirectFieldsEditor` ao montar `redirectFields` sem digitar o `name` manualmente.
- [`ui/Toast.tsx`](src/components/ui/Toast.tsx) + [`store/toastStore.ts`](src/store/toastStore.ts) — notificações flutuantes (canto inferior direito). `toast({ title, description, variant, duration })` empilha um card e não retorna Promise (fire-and-forget). Usado na Toolbar ao exportar, importar e limpar o formulário.
- [`icons/Icon.tsx`](src/components/icons/Icon.tsx) — ícones SVG vendorizados a partir do catálogo Lucide (licença ISC), sem dependência de `lucide-react`.

### Toast — parâmetros

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `description` | `string` | — | **Obrigatório.** Conteúdo do texto da notificação. |
| `title` | `string?` | — | Título curto. Omitido, o toast exibe só a descrição. |
| `variant` | `"info" \| "success" \| "warning" \| "danger"` | `"info"` | Cor, ícone e urgência: `warning`/`danger` usam `role="alert"` + `aria-live="assertive"`; `info`/`success` usam `role="status"` + `aria-live="polite"`. |
| `duration` | `number?` (ms) | `5000` | Tempo de exibição. Todo toast da aplicação usa o padrão; informe um valor só para casos específicos. `0` desativa o auto-dismiss — o toast só fecha no clique. |

```ts
import { toast } from "@/store/toastStore";

toast({ title: "Formulário exportado", description: "JSON copiado.", variant: "success" });
toast({ title: "Falha ao exportar", description: "O campo 'cpf' está sem nome.", variant: "danger" });
```

Comportamento: máximo de 4 toasts simultâneos (`MAX_TOASTS`, o mais antigo sai), timer pausa no hover/foco e retoma do tempo restante, host não-modal (`pointer-events-none` no container, sem focus-trap) montado uma única vez em [`App.tsx`](src/App.tsx). As cores vêm dos tokens `--info`, `--success`, `--warning` e `--danger`, então claro/escuro é automático.

---

## Tipos de Input Suportados

**28 tipos** organizados em 8 categorias (fonte única em [categories.ts](src/components/inputs/categories.ts) + [registry.ts](src/components/inputs/registry.ts)):

| Categoria | Tipos |
|---|---|
| **Texto** | `input-text`, `input-textarea`, `input-email`, `input-password`, `input-phone` |
| **Numérico** | `input-number`, `input-decimal`, `input-money` |
| **Data/Hora** | `input-date`, `input-time` |
| **Documentos BR** | `input-cpf`, `input-cnpj`, `input-rg`, `input-pis` |
| **Avançado** | `input-mask`, `input-color`, `input-json`, `input-ocr`, `input-report`, `divider-component` |
| **Upload** | `input-attach` |
| **Modal/Lookup** | `input-modal`, `input-cep-modal` |
| **Seleção** | `select-multiple`, `select-search`, `dynamic-select`, `radio-component`, `checkbox-component` |

### Props base (herdadas por todos)

`BaseInputPropsSchema` ([base.schema.ts](src/schemas/base.schema.ts)) tem **16 props**: `name` *(obrigatório)*, `label`, `placeholder`, `required`, `readonly`, `hint`, `min`, `max`, `showCaracterCounter`, `highlight`, `doNotTranslate`, `customRequiredWarning`, `value`, `labelClass`, `requestFocus`, `keyboardOptions`.

`class`, `hide` e `colSpan` **não** fazem parte desse schema — vivem no envoltório de cada campo (`wrap()` em [inputs.schema.ts](src/schemas/inputs.schema.ts)), junto com `id` e `type`. `divider-component` é uma exceção: estende `BaseComponent` da v3, não `InputBaseComponent`, então só usa um subconjunto dessas props.

> Cada tipo também tem props específicas — ex: `input-money` tem `minValue`/`maxValue`, `input-mask` tem `mask`/`clearSpecialCharacter`, selects/`radio-component` têm `source: Array<{key, value}>` (ou `{label, value}` para radio), `checkbox-component` tem apenas `checked` (um único booleano, sem `source`), `input-modal`/`dynamic-select` exigem `entity` preenchida para exportar.
>
> Para o levantamento detalhado de props da v3 que ainda não têm equivalente no builder (por tipo), veja [`docs/v3-props-gaps.md`](docs/v3-props-gaps.md).

---

## Grid Layout

O canvas usa **CSS Grid 12 colunas** (`grid-cols-12 gap-3`). Cada campo tem uma prop `colSpan` (1-12) que controla quantas colunas ocupa — e há dois defaults diferentes dependendo de onde ele é definido:

| Situação | Default | Onde |
|---|---|---|
| Campo novo (arrastado da paleta) | `6` | [`formStore.addField`](src/store/formStore.ts) |
| Campo sem `colSpan` ao parsear via Zod (import legado, dados corrompidos) | `12` | [`inputs.schema.ts`](src/schemas/inputs.schema.ts) (`wrap()`) e [`gridClass.ts`](src/utils/gridClass.ts) |

```ts
// src/utils/gridClass.ts
colSpanClass(1)  // → "col-span-1"
colSpanClass(6)  // → "col-span-6"
colSpanClass(12) // → "col-span-12"  (fallback quando colSpan é undefined/NaN)
```

**Exemplo:** dois campos lado a lado:

```json
{ "type": "input-cpf", "class": "d-block mb-2 col-md-6", "props": { "name": "cpf" } }
{ "type": "input-rg",  "class": "d-block mb-2 col-md-6", "props": { "name": "rg" } }
```

> A reordenação por drag acontece "ao vivo" (`onDragOver`, não só `onDragEnd`) — ver [Canvas](#②-canvas--formulário--canvaspaneltsx).

---

## Persistência

- **Chave do storage:** `form-builder:draft`
- **Versão atual:** `2` — ao migrar de `v1`, cada field sem `colSpan` recebe `colSpan: 12` (preserva o comportamento antigo dos rascunhos já salvos; campos criados hoje já nascem com `colSpan: 6`, ver [Grid Layout](#grid-layout))
- **Auto-save:** transparente via middleware `persist` do Zustand — `partialize` grava só `{ formId, createdAt, updatedAt, fields }` (sem `selectedFieldId`)
- **Defesa contra corrupção:** ao rehidratar, cada field passa por `FieldSchema.safeParse`. Se algum falhar → remove a chave e reseta para o estado inicial
- **Tema:** claro/escuro é uma preferência separada (`form-builder-theme`), fora do `persist` do `formStore`
- **Limite prático:** ~5MB (formulários típicos < 100KB)

**Botão "Limpar"** (atrás de um diálogo de confirmação) zera o estado e remove a chave `form-builder:draft` do `localStorage`.

---

## Schema do JSON Exportado

O JSON exportado **é o formato nativo da v3** (`IFormSourceItem[]`, espelhado em [`types/formSourceItem.ts`](src/types/formSourceItem.ts)) — não um payload próprio do builder. Isso significa que o `colSpan` não aparece como campo separado: ele é mesclado na `class` como um token Bootstrap `col-md-N`, e `min`/`max` (editados como string no builder) voltam a ser `number`.

```json
[
  {
    "type": "input-text",
    "class": "d-block mb-2 col-md-6",
    "props": {
      "name": "nome",
      "label": "Nome completo",
      "required": true,
      "placeholder": "Digite seu nome",
      "max": 100
    }
  },
  {
    "type": "input-cpf",
    "class": "d-block mb-2 col-md-6",
    "hide": true,
    "props": { "name": "cpf", "label": "CPF" }
  }
]
```

- `class` vazia no builder gera o padrão `d-block mb-2 col-md-N`; uma classe customizada é preservada (qualquer `col-md-*` já presente é descartado — o `colSpan` do campo sempre prevalece).
- `hide` só aparece no JSON quando é `true`.
- `id` do builder e os metadados internos (`formId`, `createdAt`, `updatedAt`) **não** entram no export — são detalhe de implementação do rascunho, não do formato v3.

### Exportar

Toolbar → **Exportar JSON**:
1. Valida o payload interno completo via `FormSchema` (Zod) — bloqueia se inválido
2. Verifica que todo `dynamic-select`/`input-modal` tenha `entity` preenchida — bloqueia com mensagem específica se não (checagem feita aqui, não no schema, para não invalidar rascunhos parcialmente preenchidos durante a edição)
3. Converte para `IFormSourceItem[]` (`toV3SourceList`)
4. Copia para clipboard (best-effort) **e** faz download de `form.json`

### Importar

Toolbar → **Importar** (upload de `.json` ou paste em textarea) aceita dois formatos:

1. **Array** — o mesmo formato `IFormSourceItem[]` que o export gera (ou vindo de fora, da v3). O `id` de cada campo é gerado de novo; o `colSpan` é extraído do token `col-md-N` da `class` (default `12` se ausente); `action`/`group` da v3 são ignorados.
2. **Objeto** — o payload interno do builder (`{ schemaVersion, formId, createdAt, updatedAt, fields }`), usado como backup/restore 1:1 do rascunho.

Em ambos os casos: erros formatados por caminho (`campo.subcampo: mensagem`) e confirmação (via diálogo, não `window.confirm`) antes de sobrescrever um rascunho não vazio.

---

## Testes

```bash
pnpm test                # Roda toda a suite
pnpm test:watch          # Modo TDD
pnpm test:coverage       # Gera relatório em coverage/
```

**Cobertura:** suite organizada em camadas, 24 arquivos em [`src/__tests__/`](src/__tests__/):

| Camada | Tipo | Exemplos |
|---|---|---|
| Schemas Zod | Unit | `schemas/inputs.test.ts`, `schemas/registry.test.ts` |
| Store | Unit | `store/formStore.test.ts`, `store/persist.test.ts`, `store/toastStore.test.ts` |
| Utils | Unit | `utils/exportImport.test.ts`, `utils/gridClass.test.ts`, `utils/id.test.ts` |
| Categorias | Unit | `components/categories.test.ts` |
| DnD | Unit | `components/canvasCollision.test.ts` |
| UI Kit | Integration | `components/Button.test.tsx`, `components/AlertDialog.test.tsx`, `components/FieldPickerDialog.test.tsx`, `components/Toast.test.tsx` |
| Editores | Integration | `components/StringEditor.test.tsx`, `components/JsonEditor.test.tsx`, `components/SourceEditor.test.tsx`, `components/FieldsEditor.test.tsx`, `components/RedirectFieldsEditor.test.tsx` |
| Componentes de layout | Integration | `components/LeftPanel.test.tsx`, `components/CanvasPanel.test.tsx`, `components/PropsPanel.test.tsx`, `components/Toolbar.test.tsx`, `components/InputPreview.test.tsx` |

**Thresholds** (config embutida em `vite.config.ts`, seção `test.coverage`): statements 80% / branches 80% / functions 80% / lines 80%. **CI** roda `pnpm test` (sem coverage) em cada push/PR para `main`.

**Cobertura real atual** (`pnpm test:coverage`, medido em 2026-09-16): **90.95%** statements, **87.40%** branches, **83.33%** functions, **90.95%** lines — folga confortável acima do threshold de 80% em todas as métricas. Alguns pontos concentram a diferença:

| Área | Statements | Observação |
|---|---|---|
| `src/schemas/` | 100% | Zod schemas totalmente cobertos |
| `src/components/inputs/` | 100% | registry + categories + preview |
| `src/utils/` | 98.34% | export/import/gridClass/id |
| `src/components/ui/` | 95.17% | Button/AlertDialog/FieldPickerDialog/Toast |
| `src/store/` | 86.58% | `formStore.ts` tem trechos de `migrate`/`merge` não exercitados |
| `src/components/layout/` | 68.42% | `AppShell.tsx` está em **0%** — a orquestração do `DndContext` (drag start/over/end) não tem teste direto hoje |

> `App.tsx` e `AppShell.tsx` aparecem com 0% de cobertura direta: a suíte testa `CanvasPanel`/`LeftPanel`/`PropsPanel`/`Toolbar` isoladamente via store, mas não monta o `DndContext` completo em um teste de integração ponta a ponta.

---

## Roadmap

### v2+ (Fora de Escopo Atual)

- [ ] Múltiplos formulários (lista + CRUD local)
- [ ] Integração API (persistência remota, versionamento)
- [ ] Autenticação + multi-tenant
- [ ] Plugar Biome em um script (`pnpm lint`/CI) — dependência e config já presentes, ainda não usados no fluxo
- [ ] Acessibilidade de teclado no D&D (`KeyboardSensor` do @dnd-kit) — diálogos (AlertDialog/FieldPicker) e seleção de card já são acessíveis por teclado; arrastar ainda depende do ponteiro
- [ ] Histórico undo/redo
- [ ] Templates reutilizáveis
- [ ] Validação avançada (regex, dependências entre campos)
- [ ] i18n do próprio builder

---

## Referências

- [Plano de implementação original (v2)](.claude/plans/form-builder.plan-v2.md) — fases, decisões, riscos e critérios de aceite da primeira versão
- [`docs/v3-props-gaps.md`](docs/v3-props-gaps.md) — lacunas de props conhecidas entre o builder e a `populis-v3-core`, por tipo de input
