# Plan: Esqueleto de Rotas

**Complexidade**: Baixa
**Status**: Aguardando confirmação
**Data**: 2026-06-12

## Resumo

A aplicação não possui roteamento. Este plano introduz a estrutura base de rotas com `react-router` v7 (modo biblioteca): a rota base (`/`) será a página de Login (placeholder), `/builder` renderizará o `AppShell` (componente principal atual), e qualquer rota inexistente cairá numa página 404. O esqueleto fica preparado para rotas protegidas/autenticação no futuro, sem implementá-las agora.

## Requisitos

- Rota base (`/`) → página de **Login** (placeholder, sem autenticação real por enquanto)
- `/builder` → `AppShell` (componente exportado pelo `App` hoje)
- `*` (catch-all) → página **404 Not Found**
- Estrutura preparada para rotas protegidas futuras (`ProtectedRoute` esqueleto)

## Padrões do Codebase a Seguir

| Categoria | Fonte | Padrão |
|---|---|---|
| Exports | `src/components/layout/AppShell.tsx:22` | Named exports em componentes (`export function X()`); default export apenas no `App` |
| Imports | `src/components/layout/AppShell.tsx:13` | Alias `@/` para `src/` |
| Estilo | `src/components/layout/AppShell.tsx:102` | Tailwind com tokens de tema (`bg-background` etc.) |
| Testes | `src/__tests__/components/Toolbar.test.tsx` | Vitest + RTL em `src/__tests__/`, descrições em português |

Não existe padrão de roteamento no projeto — será introduzido um novo.

## Arquivos a Alterar

| Arquivo | Ação | Motivo |
|---|---|---|
| `package.json` | UPDATE | Adicionar `react-router` v7 |
| `src/pages/LoginPage.tsx` | CREATE | Placeholder de login; botão navega para `/builder` via `useNavigate` |
| `src/pages/BuilderPage.tsx` | CREATE | Wrapper fino que renderiza `<AppShell />` |
| `src/pages/NotFoundPage.tsx` | CREATE | Página 404 com link de volta para `/` |
| `src/routes/ProtectedRoute.tsx` | CREATE | Esqueleto: hoje renderiza `<Outlet />`; ponto único comentado para futura checagem de auth |
| `src/routes/router.tsx` | CREATE | `createBrowserRouter` com o mapa de rotas |
| `src/App.tsx` | UPDATE | Trocar `<AppShell />` por `<RouterProvider router={router} />` |
| `src/__tests__/routes/router.test.tsx` | CREATE | Testes de navegação com `createMemoryRouter` |

## Fases de Implementação

### Fase 1: Dependência
- Instalar `react-router` v7 em modo biblioteca: `pnpm add react-router`
- Sucessor oficial do `react-router-dom` v6, mesma API declarativa (`createBrowserRouter`), compatível com React 18

### Fase 2: Páginas
- `LoginPage.tsx` — card centralizado com inputs de email/senha e botão que navega para `/builder`; tokens de tema do Tailwind
- `BuilderPage.tsx` — apenas `<AppShell />` (mantém `AppShell` intacto)
- `NotFoundPage.tsx` — mensagem 404 + link/botão para voltar à rota base

### Fase 3: Esqueleto de Rotas
- `ProtectedRoute.tsx` — renderiza `<Outlet />`; comentário marcando onde entrará o redirect para `/` quando não autenticado
- `router.tsx`:
  - `/` → `LoginPage` (pública)
  - `ProtectedRoute` (layout) → `/builder` → `BuilderPage`
  - `*` → `NotFoundPage`
- `App.tsx` → `<RouterProvider router={router} />`

### Fase 4: Testes
- `router.test.tsx` com `createMemoryRouter`:
  - `/` renderiza a tela de login
  - `/builder` renderiza o AppShell
  - Rota inexistente (ex.: `/xyz`) renderiza a página 404
  - Clique no botão de login navega para `/builder`

## Validação

```bash
pnpm lint   # tsc --noEmit
pnpm test   # vitest run
pnpm build
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Testes existentes do `AppShell`/painéis quebrarem | Baixa | Eles renderizam componentes diretamente, sem depender do `App`; nada muda neles |
| Estado do builder (zustand persist) perdido ao navegar | Baixa | O store persiste fora da árvore de componentes; navegação não o reseta |
| Escolha v6 vs v7 do react-router | Baixa | v7 modo declarativo tem a mesma API do v6; migração futura zero |

## Decisão Registrada: Não Migrar para Next.js

Avaliado e descartado, mesmo com a chegada futura de 3 serviços de API (login, autenticação, formulário):

- **Sem necessidade de SEO/SSR** — form builder é ferramenta autenticada; renderização no servidor não agrega
- **3 endpoints não justificam framework fullstack** — backend leve separado (Hono/Fastify/Express ou serverless functions) resolve
- **Custo de migração real** — dnd-kit e zustand persist (localStorage) são client-only; exigiriam `"use client"` e cuidados com hydration em quase toda a árvore
- **Stack atual saudável** — Vite + Vitest + CI funcionando; migrar agora é risco sem feature nova

**Reavaliar se**: surgir área pública com SEO (landing, formulários públicos compartilháveis com render no servidor) ou backend crescer acoplado ao front.

## Critérios de Aceite

- [ ] `pnpm lint`, `pnpm test` e `pnpm build` passam
- [ ] `/` mostra login; `/builder` mostra o builder; rota inválida mostra 404
- [ ] `AppShell` e testes existentes intocados
- [ ] `ProtectedRoute` pronto para receber a checagem de auth futura
