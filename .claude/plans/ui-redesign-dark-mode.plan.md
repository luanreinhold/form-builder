# Plan: Redesign UI/UX + Dark/Light Mode

**Fonte**: Solicitação conversacional (referência visual: paleta dark em 2 colunas, estilo shadcn form-builder)
**Complexidade**: Média
**Status**: Aguardando confirmação

## Resumo

Redesign puramente estético do form-builder mantendo a divisão em 3 painéis (LeftPanel · CanvasPanel · PropsPanel) + Toolbar, com adição de modo escuro/claro. Nenhuma mudança em lógica, store, schemas, DnD ou construção das telas. Acessibilidade WCAG 2.2 AA como requisito transversal.

## Requisitos

1. **Apenas estética** — nenhuma mudança de lógica ou estrutura. Mantém os 3 painéis + toolbar.
2. **Modo escuro/claro** com toggle acessível, persistido em localStorage e respeitando `prefers-color-scheme`.
3. **Painel esquerdo no estilo da referência**: cabeçalho com título + subtítulo, label de seção uppercase, grid de **2 colunas** de cards arredondados com ícone + nome.
4. **WCAG 2.2 AA**: contraste ≥ 4.5:1, foco visível, ARIA, alvos de toque ≥ 24px, `prefers-reduced-motion`.
5. **Zero quebra de testes** — preservar intactos: `Importar`, `Exportar JSON`, `Limpar`, `Cole o JSON aqui`, `Selecione um campo`, `Arraste inputs aqui`, botão com nome `/Texto/`, `data-testid="canvas-grid"`, `data-testid="autosave-status"`, `data-testid="canvas-drop-area"`, `aria-label="Arrastar campo"`, `aria-label="Remover campo"`.

## Padrões a Espelhar

| Categoria | Fonte | Padrão |
|---|---|---|
| Ícones | `src/components/icons/Icon.tsx` | SVGs Lucide **vendorizados** no mapa `paths` — novos ícones entram no mapa, sem dependência externa |
| Estilo | Todos os componentes | Tailwind utilities inline + `clsx` para classes condicionais |
| Testes | `src/__tests__/components/*.test.tsx` | RTL com queries por role/text — markup pode mudar, textos/testids não |

## Ponto de Atenção (única "lógica" nova)

Dark mode exige um hook `useTheme` que lê localStorage + `prefers-color-scheme` e aplica a classe `dark` no `<html>`. Não toca em formStore, schemas nem DnD — infraestrutura de tema isolada em arquivo novo.

## Fases

### Fase 0 — Fundação do tema
- `tailwind.config.js`: adicionar `darkMode: "class"`.
- `src/index.css`: remover cores fixas do body (hoje `#0f172a`/`#f8fafc` hardcoded), adicionar `color-scheme` (corrige date/file/select nativos no dark), antialiasing, `prefers-reduced-motion`.
- **Novo** `src/hooks/useTheme.ts`: estado do tema (light/dark, persistido).
- `index.html` ou init síncrono no hook: aplicar classe antes do paint (evita FOUC).
- `Icon.tsx`: adicionar paths `sun` e `moon` (vendorizados do Lucide).

### Fase 1 — LeftPanel (estilo da referência)
- Cabeçalho: título "Paleta" + subtítulo descritivo (ex.: "Selecione um campo para o formulário").
- Categorias como labels uppercase com chevron; botão com `aria-expanded`.
- Itens em **grid `grid-cols-2 gap-2`**.
- `DraggableInput.tsx`: card compacto `rounded-lg`, ícone à esquerda + label com `truncate` + `title` (nomes longos: "Anexo (Base64)", "Data (Calendario)"), hover com borda de destaque, `focus-visible:ring`, variantes `dark:`.
- Remover `console.log(groups)` esquecido (`LeftPanel.tsx:11`).
- Corrigir `w-62` (classe inexistente no Tailwind 3.4 — painel hoje sem largura efetiva) → `w-64`.

### Fase 2 — Toolbar
- Marca à esquerda (chip de ícone + nome do app).
- Hierarquia de botões: primário (Exportar, indigo) / secundário (Importar, outline) / destrutivo ghost (Limpar).
- Status como pill com dot colorido.
- **Toggle de tema** (sol/lua) com `aria-pressed` e `aria-label`.
- Popover de importação: `rounded-xl`, sombra elevada, foco visível. Textos e placeholder intactos.

### Fase 3 — Canvas
- `CanvasPanel.tsx`: fundo do app diferenciado do "papel" do formulário; empty state com ícone (texto atual preservado); feedback de drop (`isOver`) mais evidente.
- `SortableFormItem.tsx`: hover/seleção refinados (ring indigo), handle e botão remover com área de toque ≥ 24px (WCAG 2.5.8).
- `DragOverlayCard.tsx`: ícone da categoria + sombra elevada.

### Fase 4 — PropsPanel + editores
- `PropsPanel.tsx`, `PropEditor.tsx`, `StringEditor`/`BooleanEditor`/`JsonEditor`, `InputPreview.tsx`: focus ring consistente, seções mais legíveis, variantes `dark:` em tudo (incluindo o `baseCls` do preview).

### Fase 5 — Acessibilidade + validação
- Auditoria de contraste ≥ 4.5:1 nos dois temas (light: texto ≥ slate-500; dark: texto ≥ slate-300 sobre slate-900/800).
- `focus-visible:ring-2` em todos os interativos.
- Validação completa (abaixo).

## Arquivos

| Arquivo | Ação | Motivo |
|---|---|---|
| `tailwind.config.js` | UPDATE | `darkMode: "class"` |
| `src/index.css` | UPDATE | tokens de tema, color-scheme, motion |
| `src/hooks/useTheme.ts` | **CREATE** | único arquivo novo — toggle de tema |
| `src/components/icons/Icon.tsx` | UPDATE | +sun/moon (e ícones por input, se aprovado) |
| `src/components/layout/Toolbar.tsx` | UPDATE | classes + toggle + ARIA |
| `src/components/layout/LeftPanel.tsx` | UPDATE | header, grid 2 col, aria-expanded |
| `src/components/layout/CanvasPanel.tsx` | UPDATE | classes |
| `src/components/layout/PropsPanel.tsx` | UPDATE | classes |
| `src/components/dnd/DraggableInput.tsx` | UPDATE | card compacto |
| `src/components/dnd/SortableFormItem.tsx` | UPDATE | classes + touch targets |
| `src/components/dnd/DragOverlayCard.tsx` | UPDATE | classes + ícone |
| `src/components/props/PropEditor.tsx` | UPDATE | classes |
| `src/components/props/editors/*.tsx` | UPDATE | classes + focus ring |
| `src/components/inputs/InputPreview.tsx` | UPDATE | classes + dark variants |

## Validação

```bash
pnpm vitest run        # todos os testes atuais passam sem alteração
pnpm biome check .
pnpm build
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Quebrar testes existentes | Baixa | Só classes mudam; textos/testids/aria-labels congelados |
| Inputs nativos ilegíveis no dark | Média | `color-scheme: dark` + variantes nos controles do preview |
| Contraste insuficiente no dark | Média | slate-900/800 + texto slate-100/300, accent indigo-400 |
| FOUC (flash do tema errado) | Baixa | Classe aplicada no `<html>` antes do paint |

## Decisão em Aberto

A referência mostra **ícone diferente por input**; hoje o ícone é **por categoria** (`CATEGORY_ICONS`):
- **(a)** Manter por categoria — zero mudança estrutural.
- **(b)** Adicionar mapa visual `type → ícone` no `Icon.tsx` — puramente cosmético, ~15 SVGs vendorizados a mais. **Recomendado** para fidelidade à referência.

## Aceitação

- [ ] Dark/light mode funcional, persistido, sem FOUC
- [ ] LeftPanel em 2 colunas fiel à referência
- [ ] 3 painéis + toolbar preservados, zero mudança de lógica
- [ ] WCAG 2.2 AA (contraste, foco, ARIA, touch targets)
- [ ] `vitest run`, `biome check` e `build` verdes sem alterar testes
