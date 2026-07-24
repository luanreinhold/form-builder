# Migração de cores hard-coded para tokens semânticos de tema

**Data:** 2026-06-12
**Escopo:** `tailwind.config.js`, `src/index.css` e 13 componentes em `src/components/`

---

## Por que foi modificado

Antes da mudança, as cores do projeto eram 100% hard-coded:

- **79 ocorrências** de classes de cor literais do Tailwind (`slate-300`, `indigo-600`, `red-500`...) espalhadas em 15 arquivos.
- O `tailwind.config.js` tinha `theme: { extend: {} }` vazio — nenhum token centralizado.
- O dark mode era manual: **cada elemento** carregava seu par duplicado (`bg-white dark:bg-slate-800`, `text-slate-700 dark:text-slate-200`...). Esquecer um par `dark:` significava um elemento quebrado no tema escuro.
- A paleta "indigo = primária, slate = neutro" era uma convenção implícita, repetida classe por classe. Trocar a cor primária exigiria buscar/substituir em 15+ arquivos, com risco de inconsistência (nada impedia um `blue-600` novo).

## Como funciona agora

Arquitetura em 3 camadas (padrão shadcn/ui, nativo no Tailwind 3.4):

```
:root / :root.dark          tailwind.config.js              componentes
(src/index.css)             theme.extend.colors
─────────────────           ──────────────────              ───────────────
--surface: 248 250 252  →   surface: rgb(var(--surface)  →  className="bg-surface"
--surface: 15 23 42         / <alpha-value>)                (resolve sozinho nos 2 temas)
(no .dark)
```

1. **`src/index.css`** declara as variáveis CSS com os valores light em `:root` e os valores dark em `:root.dark`. Os valores são canais RGB (`248 250 252`) para o Tailwind poder compor opacidade (`bg-card/60`).
2. **`tailwind.config.js`** mapeia cada variável para uma cor semântica via helper `token()`. Tokens cujo valor dark já carrega alpha próprio (ex.: `--danger-surface: 69 10 10 / 0.4`) usam `fixedToken()`, sem `<alpha-value>`.
3. **Componentes** usam apenas classes semânticas (`bg-surface`, `text-foreground`, `border-edge`, `ring-ring`). Quando o `useTheme` alterna a classe `.dark` no `<html>`, as variáveis trocam de valor e **todos os componentes se adaptam automaticamente** — não existe mais nenhuma variante `dark:` de cor no código.

## Vocabulário de tokens

| Token | Light | Dark | Papel |
|---|---|---|---|
| `background` | slate-200 | slate-950 | fundo do app |
| `surface` | slate-50 | slate-900 | painéis, toolbar, canvas |
| `card` / `card-hover` | white / slate-100 | slate-800 / slate-700 | cards, inputs, botões secundários |
| `popover` | white | slate-900 | dropdown de importação |
| `muted` | slate-200 | slate-800 | badges, chips |
| `foreground` | slate-900 | slate-100 | texto principal |
| `muted-foreground` | slate-600 | slate-400 | texto secundário, labels |
| `faint` | slate-400 | slate-500 | placeholders, empty states, handles |
| `edge` / `edge-input` / `edge-soft` / `edge-hover` | slate-300/300/200/300 | slate-800/700/700/600 | bordas (estrutural / controles / sutil / hover) |
| `primary` / `-hover` / `-foreground` | indigo-600 / 700 / white | iguais | ações primárias |
| `primary-active` | indigo-500 | indigo-400 | seleção, drop-target, focus border |
| `primary-surface` | indigo-50 | indigo-950/30 | fundo do drop-target |
| `accent` / `-hover` / `-foreground` / `-edge` | indigo-50 / 100 / 700 / 300 | slate-700 / 600 / indigo-300 / 500 | hover interativo sutil (paleta, file input) |
| `ring` / `ring-soft` | indigo-500 / indigo-200 | indigo-500 / indigo-500/40 | focus rings (forte / suave) |
| `danger` (+ `-hover`, `-surface`, `-surface-hover`, `-edge`, `-active`, `-soft`) | família red | família red | erros, exclusão |
| `success` | emerald-500 | emerald-500 | status "Salvo" |

## Comportamentos que mudaram

**Principal:** componentes agora reagem à troca dark/light **por definição** — um componente novo escrito com tokens nunca precisa de `dark:` para cores, e é impossível "esquecer" o tema escuro.

**Normalizações visuais intencionais** (tons quase-iguais consolidados em um token):

| Onde | Antes | Depois |
|---|---|---|
| Botão de tema (Toolbar) | `dark:bg-transparent` | `bg-card` (slate-800 no dark) — igual aos outros botões secundários |
| Textos secundários | mistura de slate-500/600/700 (light) e 300/400/500 (dark) | consolidados em `muted-foreground` e `faint` |
| Labels de botões/cards (700/200) | quase-foreground | `foreground` (900/100) — contraste levemente maior |
| Canvas (área droppable) | `bg-white` no light | `bg-surface` (slate-50) |
| Hover do Limpar (dark) | `bg-red-950/50` | `bg-danger-surface` (red-950/40) — mesmo valor do PropEditor |
| Drop-target do canvas (dark) | `bg-indigo-950/30` | mantido — alpha embutido na variável |
| Focus ring suave (dark) | ora `indigo-500` cheio, ora `/40` | unificado em `ring-soft` (indigo-500/40) |
| Empty state do PropsPanel (dark) | `bg-transparent` | `bg-card/60` (caixa sutilmente visível) |
| Checkbox (BooleanEditor, dark) | `border-slate-600` | `border-edge-input` (slate-700) |

Nenhuma lógica de componente, teste ou comportamento funcional foi alterado — apenas `className`s e a infraestrutura de tema.

## Validação

- `pnpm lint` (tsc --noEmit): ✅ sem erros
- `pnpm test`: ✅ 77/77 testes passando (11 arquivos)
- Grep de garantia: ✅ zero classes de cor literais e zero `dark:` em `src/components/`
- `pnpm build`: não executado (interrompido pelo usuário)

## Como usar daqui pra frente

- **Novo componente:** use somente tokens (`bg-card`, `text-muted-foreground`, `border-edge-input`, `focus-visible:ring-ring`). Não use cores literais nem `dark:`.
- **Trocar a cor primária:** edite apenas as variáveis `--primary*`, `--accent*` e `--ring*` no `src/index.css` (light e dark). Nenhum componente precisa mudar.
- **Novo token:** declare a variável nos dois blocos do `index.css`, mapeie no `tailwind.config.js` com `token()` (ou `fixedToken()` se o valor dark precisar de alpha embutido).
- **Limitação dos `fixedToken`:** `primary-surface`, `ring-soft`, `danger-soft`, `danger-surface` e `danger-surface-hover` não aceitam modificador de opacidade (`/50`) na classe, pois o alpha já vive na variável dark.
