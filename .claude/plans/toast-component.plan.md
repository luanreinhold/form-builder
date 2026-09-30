# Plan: Toast (Toastr) de notificação

**Source PRD**: N/A (modo conversacional — `/ecc:plan`)
**Selected Milestone**: Adicionar ao UI Kit um host de notificações flutuantes com texto, título, duração e variante
**Complexity**: Medium (~3–5h)
**Status**: concluído

## Summary
Componente de UI do próprio builder (não é um tipo de campo da paleta): `toast({ title, description, variant, duration })` empilha um card no canto inferior direito, com auto-dismiss configurável e 4 variantes semânticas. Segue o padrão imperativo já usado por `confirm()` e `pickField()`, mas sem Promise — toast é fire-and-forget.

## Contrato

| Parâmetro pedido | Nome | Tipo | Default |
|---|---|---|---|
| conteúdo do texto | `description` | `string` (obrigatório) | — |
| título | `title` | `string?` | ausente |
| tempo de exibição | `duration` | `number?` (ms) | `5000`; `0` = persistente |
| "a classe" | `variant` | `"info" \| "success" \| "warning" \| "danger"` | `"info"` |

Chamado de `variant` (não `class`) para casar com `ButtonProps.variant` e `ConfirmOptions.variant` — `class` no projeto significa o grid Bootstrap exportado no JSON v3.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Store imperativa | [dialogStore.ts:36-54](src/store/dialogStore.ts#L36-L54) | `create<Store>()` + atalho de módulo via `getState()` |
| Host único no root | [App.tsx:6-10](src/App.tsx#L6-L10) | Hosts montados fora do `AppShell` |
| Portal + a11y | [AlertDialog.tsx:76-111](src/components/ui/AlertDialog.tsx#L76-L111) | `createPortal(..., document.body)` + JSDoc em PT explicando decisões |
| Variantes por mapa | [Button.tsx:27-40](src/components/ui/Button.tsx#L27-L40) | `Record<Variant, string>` com tokens semânticos, nunca cores cruas |
| Tokens de tema | [index.css:45-53](src/index.css#L45-L53) + [tailwind.config.js](tailwind.config.js) | Par `:root` / `:root.dark` em canais RGB; surfaces com alpha no dark → `fixedToken()` |
| Ícones | [Icon.tsx:8](src/components/icons/Icon.tsx#L8) | Paths Lucide vendorizados no mapa `paths` |
| Tests | [AlertDialog.test.tsx](src/__tests__/components/AlertDialog.test.tsx) | Vitest + RTL, descrições em PT sem acento, reset do store no `beforeEach` |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/store/toastStore.ts` | CREATE | Fila + `push`/`dismiss`/`clear` + atalho `toast()` |
| `src/components/ui/Toast.tsx` | CREATE | `ToastHost` (live region) + `ToastItem` (card, ícone, fechar, timer) |
| `src/index.css` | UPDATE | Tokens `--warning*`, `--info*`, `--success-surface/-edge` (light + dark) |
| `tailwind.config.js` | UPDATE | Cores `warning`/`info`, `success` como objeto, keyframe `toast-in` |
| `src/components/icons/Icon.tsx` | UPDATE | `alert-circle`, `alert-triangle`, `check-circle`, `info` |
| `src/App.tsx` | UPDATE | Monta `<ToastHost />` |
| `src/components/layout/Toolbar.tsx` | UPDATE | Primeiro consumidor: exportar/importar/limpar |
| `src/__tests__/store/toastStore.test.ts` | CREATE | Fila, ids, limite, dismiss, clear |
| `src/__tests__/components/Toast.test.tsx` | CREATE | Render, variantes, timers, a11y, StrictMode |
| `README.md` | UPDATE | Seção **UI Kit e Diálogos** + estrutura + cobertura |

## Decisões de implementação
- **Timer no `ToastItem`, não na store**: hover, foco e desmontagem cancelam naturalmente, e a store segue pura/testável. Retoma do tempo restante (não reinicia do zero).
- **`duration <= 0` = persistente**: usado no erro de exportação, que precisa ficar na tela até o usuário ler.
- **Live region por variante**: `warning`/`danger` → `role="alert"` + `aria-live="assertive"`; `info`/`success` → `role="status"` + `aria-live="polite"`. `aria-atomic="true"` faz o leitor anunciar título + descrição juntos, dispensando `aria-labelledby`/`describedby` (que o Biome também rejeita nesses roles).
- **Não modal**: sem focus-trap e sem travar o scroll do body; container com `pointer-events-none` para nunca bloquear clique no canvas. `z-[60]` fica acima do `z-50` do AlertDialog.
- **`MAX_TOASTS = 4`**: acima disso o mais antigo sai, evitando empilhar a tela e transformar a live region em monólogo.
- **Badge `autosave-status` da Toolbar preservado**: o toast complementa, não substitui — os testes existentes seguem verdes sem edição.
- **Erros de import continuam inline** no painel (é onde o usuário está olhando); o toast cobre só o sucesso, que fecha o painel.

## Validation
```bash
pnpm lint
pnpm exec biome check src
pnpm test
pnpm test:coverage
pnpm build
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Fake timers brigando com `userEvent` | Alta | Testes usam `fireEvent` + `vi.advanceTimersByTime` dentro de `act()`; `vi.useRealTimers()` no `afterEach` |
| `StrictMode` monta o efeito duas vezes e encurta o timer | Média | Cleanup subtrai só o tempo decorrido; teste dedicado renderizando o host em `StrictMode` |
| Contraste ruim de amber/sky no dark | Média | Mesma proporção do `--danger*`: cor 400 no dark + surface `950/0.4` |
| Toast sobrepondo dialog/popover | Baixa | `z-[60]` acima do `z-50` do dialog e do `z-10` do popover de importar |
| `aria-live="assertive"` em rajada | Baixa | Assertivo só em `warning`/`danger` + limite de 4 |

## Acceptance
- [x] `toast()` disparável de qualquer módulo, sem prop drilling
- [x] 4 variantes com tokens semânticos, claro e escuro
- [x] Auto-dismiss no `duration` (default 5s), `duration: 0` persiste, hover/foco pausam e retomam
- [x] Fechável por clique, com `aria-label`
- [x] Toolbar dispara toasts sem quebrar testes existentes
- [x] `pnpm lint`, `pnpm test` (297), `pnpm test:coverage` (90.95%) e `pnpm build` verdes
- [x] README atualizado
