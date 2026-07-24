# Plan: Corrigir inconsistências de drag-and-drop no canvas

**Origem**: Relato de bug — movimentação de inputs inconsistente no canvas
**Complexidade**: Média (~2-4h)
**Data**: 2026-06-11

## Sumário

O canvas apresenta dois sintomas: (1) às vezes não é possível trocar a posição de um item com outro — o drop não faz nada; (2) ao sobrepor um item sobre outro, o preview aparece desproporcional, achatado e saindo fora do formulário. Ambos têm causa-raiz identificada no setup do dnd-kit.

## Diagnóstico (causas-raiz)

### 1. Campo "achatado/desproporcional" durante a sobreposição

- `src/components/dnd/SortableFormItem.tsx:29` usa `CSS.Transform.toString(transform)`. Com a `rectSortingStrategy`, o dnd-kit calcula `scaleX`/`scaleY` para "encaixar" cada vizinho no slot do item arrastado. Como os campos têm `colSpan` variável (1 a 12 colunas), essas escalas distorcem os cards — efeito "achatado".
- Agravante: a `rectSortingStrategy` assume itens de tamanho igual. Num grid de 12 colunas com larguras variadas, as posições projetadas ficam erradas e os cards "voam" para fora do form durante o preview.

### 2. Às vezes não consegue trocar a posição de um item com outro

- O `DndContext` usa `closestCenter` global (`src/components/layout/AppShell.tsx:81`). O droppable do canvas inteiro (`canvas-droppable`) também participa da detecção de colisão.
- Quando o centro do canvas fica mais próximo do ponteiro do que o centro de qualquer card (comum com itens largos ou no meio do form), o `over` vira `canvas-droppable`. Em `AppShell.tsx:64-67`, o `findIndex` retorna `-1` e o reorder vira um no-op silencioso.

## Padrões a espelhar

| Categoria | Fonte | Padrão |
|---|---|---|
| Estado/reorder | `src/store/formStore.ts:109` | `reorderByIndex` já existe e será reutilizado no `onDragOver` |
| Testes | `src/__tests__/components/CanvasPanel.test.tsx` | Vitest + Testing Library, mesmo estilo dos testes existentes |
| Estilo | `src/components/dnd/SortableFormItem.tsx` | Tailwind + `clsx`, classes dark-mode pareadas |

## Arquivos a alterar

| Arquivo | Ação | Motivo |
|---|---|---|
| `src/components/layout/AppShell.tsx` | UPDATE | Colisão customizada + reorder no `onDragOver` |
| `src/components/dnd/SortableFormItem.tsx` | UPDATE | `CSS.Translate` no lugar de `CSS.Transform` |
| `src/components/layout/CanvasPanel.tsx` | UPDATE | Strategy do `SortableContext` sem transform de projeção |
| `src/components/dnd/DragOverlayCard.tsx` | UPDATE | Overlay proporcional para itens do canvas |
| `src/__tests__/components/CanvasPanel.test.tsx` | UPDATE | Cobrir reorder com colSpan variável e drop no container |

## Tarefas

### Fase 1 — Detecção de colisão correta (corrige o "não troca")

- **Ação**: Em `AppShell.tsx`, substituir `closestCenter` por uma função customizada: `pointerWithin` primeiro e, como fallback, `closestCenter`. Quando o item arrastado vem do canvas (ou quando há colisão com algum card), excluir `canvas-droppable` dos candidatos — o container só deve ser alvo para itens vindos da paleta sobre área vazia.
- **Mirror**: assinatura `CollisionDetection` do `@dnd-kit/core`.
- **Validar**: arrastar um item do canvas sobre qualquer outro sempre resulta em reorder.

### Fase 2 — Eliminar a distorção (corrige o "achatado")

- **Ação 2a**: Em `SortableFormItem.tsx`, trocar `CSS.Transform.toString(transform)` por `CSS.Translate.toString(transform)` (descarta scale).
- **Ação 2b**: Em `CanvasPanel.tsx` + `AppShell.tsx`, mover a reordenação do `onDragEnd` para `onDragOver` (padrão recomendado do dnd-kit para grids heterogêneos), usando `reorderByIndex`. O grid real reflui durante o arrasto — preview fiel, sem transforms projetados errados. A strategy do `SortableContext` passa a retornar `null` (sem transform de projeção).
- **Validar**: nenhum card escala/achata durante o drag; nada sai do contorno do form.

### Fase 3 — Overlay proporcional ao campo arrastado

- **Ação**: Hoje o `DragOverlayCard` é um "chip" pequeno mesmo ao arrastar um campo do canvas. Renderizar, para origem `canvas`, um overlay com o preview real do campo (`InputPreview`) e largura igual ao card original (via `e.active.rect.current.initial`), mantendo o chip apenas para itens da paleta.
- **Validar**: o fantasma do drag tem a mesma proporção do card original.

### Fase 4 — Testes e validação

- **Ação**: Atualizar/estender `CanvasPanel.test.tsx` cobrindo: reorder entre itens de `colSpan` diferentes; drop de item do canvas sobre `canvas-droppable` (não deve ser no-op inesperado); drop da paleta sobre área vazia continua adicionando campo.

## Validação

```bash
pnpm vitest run
pnpm biome check
pnpm build
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Reorder no `onDragOver` grava no store (persist) a cada hover | Média | Se ficar ruidoso, aplicar reorder em estado local e commitar no `onDragEnd` |
| `pointerWithin` falha sem ponteiro (teclado) | Baixa | Só há `PointerSensor` hoje; fallback `closestCenter` cobre |
| Medição da largura do card para o overlay | Baixa | Usar `e.active.rect.current.initial` do dnd-kit, sem medição manual |

## Aceitação

- [ ] Trocar a posição de dois itens funciona em qualquer região do form
- [ ] Nenhum card aparece achatado/desproporcional durante o drag
- [ ] Nenhum card sai visualmente do contorno do formulário durante o preview
- [ ] Overlay do drag proporcional ao campo original
- [ ] `pnpm vitest run`, `pnpm biome check` e `pnpm build` passam
