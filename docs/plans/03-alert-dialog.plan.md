# Plano: Componente próprio de Alert-Dialog

**Fonte**: requisito do usuário (texto livre)
**Funcionalidade**: confirmação reutilizável para substituir `window.confirm()`
**Complexidade**: Média
**Status**: ✅ Implementado

## Resumo

Componente de confirmação (`alertdialog`) **próprio**, sem dependências externas, com API
imperativa baseada em promise: `if (await confirm({ title })) { ... }`. Encaixa nas convenções
do projeto — store **zustand** ([formStore.ts](../../src/store/formStore.ts)), `<Button>` próprio
e tokens semânticos ([index.css](../../src/index.css)) que respeitam dark/light sem JS. Substitui
os dois `window.confirm()` nativos da Toolbar (import e clear).

## Decisão: componente próprio × shadcn (Base UI)

Avaliadas as duas abordagens para um único alert-dialog mantendo o design system atual.

| Critério | shadcn (Base UI) | Componente próprio (escolhido) |
|---|---|---|
| Acessibilidade | pronta e testada | por nossa conta (escopo pequeno, replicável) |
| Tempo até funcionar | médio — `init` + remapear tokens | direto, no padrão já dominado |
| Consistência visual | exige editar classes p/ casar tokens | usa nossos tokens e `<Button>` |
| Convenções do repo | introduz `cn`/`tailwind-merge`/`cva` + botões shadcn | zero convenção nova |
| Bundle | **+~20–27 KB gz** | **~1 KB gz** |
| Escala futura | ótimo **se** adotar vários componentes shadcn | reimplementa cada um |

**Atrito decisivo do shadcn**: o sistema de tokens não bate. shadcn espera `border`,
`destructive`, `*-foreground`; o projeto usa `edge`, `danger`, etc.
([tailwind.config.js](../../tailwind.config.js)). O componente gerado não sairia pronto — teria
que ser editado à mão, anulando o "just works". Além disso, ~9 KB do bundle (`tailwind-merge` +
`cva`) é custo fixo da infra shadcn, "desperdiçado" num único componente.

**Conclusão**: para um alert-dialog isolado, mantendo o design system atual, o componente próprio
vence (zero deps, encaixe imediato, sem 2ª convenção). shadcn só se justificaria com a intenção de
migrar vários componentes de UI para a base dele.

## Decisão de arquitetura

**API imperativa (promise) + store zustand + host único no root.** Os call sites já eram
imperativos e inline (`if (!window.confirm(...)) return`), então `confirm(): Promise<boolean>` é
migração quase 1:1, sem espalhar estado `open/onConfirm/onCancel` por cada componente.

## Padrões espelhados

| Categoria | Fonte | Padrão |
|---|---|---|
| Store | [formStore.ts:10-31](../../src/store/formStore.ts#L10-L31) | `create()` zustand, `interface State`/`Actions`, `export type Store = State & Actions` |
| Componente UI | [Button.tsx:40-52](../../src/components/ui/Button.tsx#L40-L52) | `ui/` PascalCase, `forwardRef`, só tokens semânticos, doc-comment em PT |
| Overlay visual | [Toolbar.tsx:115-145](../../src/components/layout/Toolbar.tsx#L115-L145) | `bg-popover`, `border-edge-soft`, `rounded-xl`, `shadow-xl` |
| Tokens destrutivos | [index.css:46-52](../../src/index.css#L46-L52) | `text-danger`, `bg-danger-surface`, dark via `:root.dark` |
| Testes | [Button.test.tsx](../../src/__tests__/components/Button.test.tsx) | `@testing-library`, `getByRole`, vitest+jsdom, descrições em PT |

## Arquivos alterados / criados

| Arquivo | Ação | Porquê |
|---|---|---|
| [src/store/dialogStore.ts](../../src/store/dialogStore.ts) | CREATE | Estado + `confirm()`/`resolve()`; resolver da promise fora do estado |
| [src/components/ui/AlertDialog.tsx](../../src/components/ui/AlertDialog.tsx) | CREATE | Host: portal, foco, teclado, ARIA |
| [src/App.tsx](../../src/App.tsx) | UPDATE | Monta `<AlertDialogHost/>` uma vez no root |
| [src/components/layout/Toolbar.tsx](../../src/components/layout/Toolbar.tsx) | UPDATE | Troca os 2 `window.confirm()` por `await confirm(...)` |
| [src/__tests__/components/AlertDialog.test.tsx](../../src/__tests__/components/AlertDialog.test.tsx) | CREATE | 6 testes: abrir/confirmar/cancelar/Esc/ARIA/foco |
| [src/__tests__/components/Toolbar.test.tsx](../../src/__tests__/components/Toolbar.test.tsx) | UPDATE | Teste de "limpar" agora confirma via dialog |

## Acessibilidade

- `role="alertdialog"`, `aria-modal`, `aria-labelledby`/`aria-describedby`.
- Foco inicial no **Cancelar** (seguro para ações destrutivas); foco restaurado ao fechar.
- Teclado: **Esc** cancela, **Enter** confirma, **Tab** com focus-trap.
- Scroll do `body` travado enquanto aberto.
- Backdrop **não** dispensa por clique de propósito — alertdialog exige escolha explícita.

## Validação

```bash
pnpm lint          # tsc --noEmit — OK
pnpm test          # vitest — 111 passed (6 novos AlertDialog + Toolbar atualizado)
pnpm biome check . # lint/format — OK
```

## Riscos (resolvidos)

| Risco | Status |
|---|---|
| Tests da Toolbar mockavam `window.confirm` (fluxo virou async) | ✅ atualizado p/ confirmar via dialog |
| Concorrência de chamadas a `confirm()` | ✅ confirm anterior pendente é resolvido como `false` |
| Lint a11y em backdrop interativo | ✅ removido clique no backdrop (Esc + botões) |

## Aceite

- [x] `confirm()` retorna `Promise<boolean>` e substitui os 2 `window.confirm`
- [x] Acessível: ARIA, Esc/Enter/Tab-trap, foco restaurado
- [x] Tema dark/light automático via tokens
- [x] `pnpm lint`, `pnpm test` e `pnpm biome check` verdes
- [x] Padrões espelhados (Button/formStore/Toolbar), nada reinventado
