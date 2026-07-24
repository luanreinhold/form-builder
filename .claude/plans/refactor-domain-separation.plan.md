# Plan: Refactor de Separação de Responsabilidades

**Data**: 2026-06-09
**Status**: proposed
**Complexidade**: Pequena (~5h)
**Stack**: React 18 + Zustand + Zod + Vitest + Biome

## Objetivo

Extrair lógica de domínio pura do `formStore.ts` Zustand para uma camada `domain/`, sem mudar a API pública do store, e mover regras de drag-and-drop do `AppShell.tsx` para uma função pura testável. Centralizar validação Zod hoje duplicada em 3 lugares.

**Não-objetivo:** hexagonal completa (ports/adapters/DI). Esse plano captura o núcleo útil de separação de responsabilidades sem cerimônia arquitetural prematura.

## Diagnóstico (mapeado via code-explorer)

`formStore.ts` (~225 linhas) acumula 5 responsabilidades:

1. **Estado** — `fields`, `selectedFieldId`, etc.
2. **Lógica de domínio** — manipulação de array (`splice`/`push`/`filter`), inserção em índice, reordenação, criação de field com defaults da `REGISTRY`
3. **Validação Zod** — duplicada em `importJSON` ([formStore.ts:138](../../src/store/formStore.ts)), `merge` do persist ([formStore.ts:199](../../src/store/formStore.ts)), `buildExport` ([exportForm.ts:11](../../src/utils/exportForm.ts)) e `parseImport` ([importForm.ts:14](../../src/utils/importForm.ts))
4. **Serialização** — `exportJSON`
5. **Efeitos colaterais** — `localStorage.removeItem` ([formStore.ts:130](../../src/store/formStore.ts) e [formStore.ts:203](../../src/store/formStore.ts)), `nanoid()`, `Date.toISOString()`

Além disso, [AppShell.tsx:44-67](../../src/components/layout/AppShell.tsx) mistura **regras de domínio de drop** (palette→canvas, palette→item, canvas→canvas) com **gerência de UI** (estados locais do overlay).

E o import roda `FormSchema.safeParse` **duas vezes** no mesmo payload: em `parseImport` (Toolbar) e novamente em `importJSON` (store).

## Patterns to Mirror

| Categoria | Source | Padrão |
|---|---|---|
| Nomes | `camelCase.ts` | Named exports, sem default |
| Result type | [importForm.ts:3](../../src/utils/importForm.ts) | `{ ok: true; data } \| { ok: false; errors: string[] }` |
| Validação Zod | [formStore.ts:138-144](../../src/store/formStore.ts) | `safeParse` + map `issues` para `"path: message"` |
| Imutabilidade | [formStore.ts:65-70](../../src/store/formStore.ts) | `[...arr]` + `splice` |
| Path alias | `tsconfig` | `@/` → `src/` |
| Testes | [__tests__/store/formStore.test.ts](../../src/__tests__/store/formStore.test.ts) | `describe` PT-BR, `beforeEach` reset, espelha estrutura de `src/` |

## Estrutura-alvo

```
src/
  domain/                    ← NOVO: funções puras, sem React, sem Zustand
    fieldList.ts             insertAt, moveByIndex, removeById, updateById, findIndexById
    field.ts                 createField(type, registry, idGen?)
    dropResolver.ts          resolveDropAction(active, over, fields) → DropAction
    registry.ts              MOVIDO de components/inputs/ (é domínio puro)
  services/                  ← NOVO: orquestra domain + efeitos de plataforma
    formIO.ts                parseFormPayload, buildExportPayload, serializeForm, downloadForm, copyFormToClipboard
  store/
    formStore.ts             THIN: compõe domain + persist middleware
  components/                ← inalterado (exceto imports atualizados)
    inputs/InputPreview.tsx
    inputs/                  ← registry.ts removido daqui
    dnd/DragOverlayCard.tsx
    layout/AppShell.tsx      ← onDragEnd usa resolveDropAction
    layout/Toolbar.tsx       ← imports apontam para services/formIO
```

## Arquivos a Mudar

| Arquivo | Ação | Por quê |
|---|---|---|
| `src/domain/fieldList.ts` | CREATE | Ops puras sobre `Field[]` |
| `src/domain/field.ts` | CREATE | `createField` puro, id injetável |
| `src/domain/dropResolver.ts` | CREATE | Decisão de drag/drop pura |
| `src/domain/registry.ts` | CREATE (move) | É domínio puro, não pertence a `components/` |
| `src/services/formIO.ts` | CREATE | Consolida `exportForm.ts` + `importForm.ts`, elimina validação dupla |
| `src/store/formStore.ts` | UPDATE | Compõe domain; API pública inalterada |
| `src/components/layout/AppShell.tsx` | UPDATE | `onDragEnd` chama `resolveDropAction` |
| `src/components/layout/Toolbar.tsx` | UPDATE | Imports apontam para `@/services/formIO` |
| `src/components/inputs/InputPreview.tsx` | UPDATE | Import de `@/domain/registry` |
| `src/components/dnd/DragOverlayCard.tsx` | UPDATE | Import de `@/domain/registry` |
| `src/components/inputs/registry.ts` | DELETE | Movido para `domain/` |
| `src/utils/exportForm.ts` | DELETE | Movido para `services/formIO.ts` |
| `src/utils/importForm.ts` | DELETE | Movido para `services/formIO.ts` |
| `src/__tests__/domain/fieldList.test.ts` | CREATE | Testes puros novos |
| `src/__tests__/domain/field.test.ts` | CREATE | Testes puros novos |
| `src/__tests__/domain/dropResolver.test.ts` | CREATE | Matriz de casos de drag/drop |
| `src/__tests__/utils/exportImport.test.ts` | UPDATE | Atualizar import para `@/services/formIO` |
| `src/__tests__/schemas/registry.test.ts` | UPDATE | Atualizar import para `@/domain/registry` |

## Tasks (ordem TDD, cada uma é commit isolado)

### Task 1 — `domain/fieldList.ts`
Funções puras genéricas sobre lista de itens com `id`.

```ts
insertAt<T>(list: T[], item: T, index?: number): T[]
moveByIndex<T>(list: T[], from: number, to: number): T[]
removeById<T extends {id: string}>(list: T[], id: string): T[]
updateById<T extends {id: string}>(list: T[], id: string, patch: (item: T) => T): T[]
findIndexById<T extends {id: string}>(list: T[], id: string): number
```

- **Mirror**: imutabilidade via `[...list]` ([formStore.ts:66](../../src/store/formStore.ts))
- **Validate**: `pnpm test -- domain/fieldList`

### Task 2 — `domain/field.ts`
```ts
createField(type: FieldType, registry: typeof REGISTRY, idGen?: () => string): Field
```

- Defaults atuais de [formStore.ts:57-64](../../src/store/formStore.ts): `class: ""`, `hide: false`, `colSpan: 12`
- `idGen` injetável permite testes determinísticos
- **Validate**: `pnpm test -- domain/field`

### Task 3 — `domain/dropResolver.ts`

```ts
type DropAction =
  | { kind: "add"; type: FieldType; index?: number }
  | { kind: "reorder"; from: number; to: number }
  | { kind: "noop" }

resolveDropAction(
  active: { id: string | number; data: { source?: string; type?: FieldType; id?: string } },
  over: { id: string | number } | null,
  fields: Array<{ id: string }>,
): DropAction
```

**Matriz de casos a cobrir:**
- palette + canvas-droppable → `add` sem index
- palette + over field existente → `add` com index
- palette + over null → `noop`
- canvas + canvas, ids diferentes → `reorder`
- canvas + canvas, mesmo id → `noop`
- canvas + over null → `noop`

- **Validate**: `pnpm test -- domain/dropResolver`

### Task 4 — `domain/registry.ts` (move)
- Mover [src/components/inputs/registry.ts](../../src/components/inputs/registry.ts) → `src/domain/registry.ts`
- Atualizar 4 imports: `formStore.ts`, `InputPreview.tsx`, `DragOverlayCard.tsx`, `__tests__/schemas/registry.test.ts`
- **Validate**: `pnpm typecheck && pnpm test`

### Task 5 — `services/formIO.ts` + eliminação de validação dupla

```ts
parseFormPayload(input: unknown | string): { ok: true; data: FormPayload } | { ok: false; errors: string[] }
buildExportPayload(state: FormState): { ok: true; data: FormPayload } | { ok: false; errors: string[] }
serializeForm(payload: FormPayload): string
downloadForm(payload: FormPayload, filename?: string): void
copyFormToClipboard(payload: FormPayload): Promise<boolean>
```

- `formStore.importJSON` passa a receber `FormPayload` (já tipado/validado) — elimina o `safeParse` duplicado
- Toolbar valida uma única vez via `parseFormPayload`
- Apagar `utils/exportForm.ts` e `utils/importForm.ts` após mover
- **Validate**: `pnpm test` completo (testes existentes intactos)

### Task 6 — `formStore.ts` thin (sem mudar API)

Substituir corpo das actions por composição de `domain/*`:

```ts
// Antes (formStore.ts:65-70)
set((s) => {
  const next = [...s.fields];
  if (index === undefined || index < 0 || index >= next.length) next.push(newField);
  else next.splice(index, 0, newField);
  return touch({ ...s, fields: next, selectedFieldId: id });
});

// Depois
set((s) => touch({
  ...s,
  fields: insertAt(s.fields, newField, index),
  selectedFieldId: newField.id,
}));
```

- **NÃO TOCAR** `persist.merge` nem `migrate` — frágil + bem coberto por [persist.test.ts](../../src/__tests__/store/persist.test.ts)
- Manter assinaturas: `addField`, `removeField`, `updateField`, `updateFieldMeta`, `reorderByIndex`, `reorderFields`, `selectField`, `clearAll`, `importJSON`, `exportJSON`
- **Validate**: `pnpm test -- store/formStore store/persist` passa **sem mudança nos testes**

### Task 7 — `AppShell.tsx` usa `resolveDropAction`

```ts
function onDragEnd(e: DragEndEvent) {
  const action = resolveDropAction(e.active, e.over, fields);
  if (action.kind === "add") addField(action.type, action.index);
  else if (action.kind === "reorder") reorderByIndex(action.from, action.to);
  setActiveType(null);
  setActiveSource(null);
  setActiveFieldId(null);
}
```

- Estados locais do overlay (`activeType`, `activeSource`, `activeFieldId`) **continuam** em AppShell — são UI, não domínio
- **Validate**: smoke manual no browser + `pnpm test`

## Validação Final

```powershell
pnpm install
pnpm typecheck         # tsc --noEmit
pnpm lint              # biome
pnpm test              # todos os testes existentes passam SEM mudança
pnpm test -- --coverage
```

**Smoke manual no browser:**
1. `pnpm dev`
2. Arrastar input da palette para canvas vazio → field aparece
3. Arrastar input da palette sobre field existente → insere no índice correto
4. Reordenar field por drag → ordem muda
5. Exportar JSON → baixa arquivo + copia clipboard
6. Importar JSON inválido → mostra erros
7. Limpar → confirma e zera localStorage

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Quebrar `persist.merge` ao refatorar | Média | **Não tocar** `merge` na Task 6. Só substituir corpo das actions. Testes de [persist.test.ts](../../src/__tests__/store/persist.test.ts) intactos. |
| DnD tem casos sutis (`over.id` string vs number) | Baixa | Cobrir matriz completa em `dropResolver.test.ts` antes de tocar AppShell. |
| Mover `REGISTRY` quebra imports não rastreados | Baixa | `pnpm typecheck` após Task 4 — TS pega tudo. Grep `from "@/components/inputs/registry"`. |
| Eliminação da validação dupla pode esconder bug se Toolbar passar dado bruto | Muito baixa | Tipar `importJSON(payload: FormPayload)` — TS força chamadores a validar primeiro. |
| Renomear paths quebra imports em utils → services | Baixa | Após Task 5, `pnpm typecheck` + grep `from "@/utils/exportForm"` e `from "@/utils/importForm"`. |

## Aceitação

- [ ] Todas as 7 tasks completas, cada uma em commit isolado
- [ ] `pnpm test` passa (testes existentes inalterados + novos em `__tests__/domain/`)
- [ ] `pnpm typecheck` e `pnpm lint` limpos
- [ ] `formStore.ts` reduzido de ~225 para ~120 linhas
- [ ] `FormSchema.safeParse` aparece **uma única vez** no caminho de import (em `parseFormPayload`)
- [ ] Smoke manual no browser passa nos 7 cenários
- [ ] Sem novos diretórios `ports/`, `adapters/`, `use-cases/` (proibido explicitamente)
- [ ] `src/domain/` contém apenas funções puras (sem React, sem Zustand, sem `localStorage`, sem `Date`)

## Não-Objetivos (explícitos)

- Não criar `ports/`, `adapters/`, container DI, decorators
- Não mudar API pública do `useFormStore`
- Não alterar `persist`/`migrate`/`merge` (frágil + coberto)
- Não migrar para outra biblioteca de DnD ou state
- Não introduzir Immer, eventos, CQRS
- Não cobrir DnD com testes E2E (follow-up opcional)

## Decisões pendentes de aprovação

Antes de implementar, confirmar:

1. **Eliminar validação dupla no import?** (Recomendado: sim — `importJSON` passa a aceitar `FormPayload` tipado)
2. **Mover `REGISTRY` para `domain/`?** (Recomendado: sim — é domínio puro, atualizar 4 imports)
3. **Pular `code-architect`?** (Recomendado: sim — blueprint já está detalhado, economiza tokens)
