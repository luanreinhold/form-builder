# Plan: Ícones Lucide via SVG vendorizado (sem dependências)

**Data**: 2026-06-11 (rev. 2 — arquivo único consolidado)
**Complexidade**: Baixa (~7 arquivos, mudanças mecânicas e localizadas)
**Estimativa**: 30–45 min incluindo testes

## Sumário

Adicionar ícones do catálogo [Lucide](https://lucide.dev) ao form-builder **sem instalar** `lucide-react` nem nenhum outro pacote. Os desenhos (paths SVG) são copiados do site e vendorizados em **um único componente** `Icon` com mapa de nomes tipado (`src/components/icons/Icon.tsx`). Substituem os caracteres unicode atuais (`⋮⋮`, `✕`, `−`/`+`), entram nos botões da Toolbar e ao lado dos inputs na paleta (LeftPanel), com um ícone por **categoria**.

### Decisões de arquitetura

- **Sem dependência de runtime/build**: o Lucide é usado uma única vez como catálogo de cópia (licença ISC). Depois da implementação não há nenhum vínculo — nem pacote, nem CDN. O `xmlns` no SVG é só identificador de namespace XML, não faz requisição.
- **Arquivo único, não um arquivo por ícone**: a convenção por-arquivo das bibliotecas serve para tree-shaking de centenas de ícones; com 16 ícones (~200 bytes cada) o benefício é irrelevante e o custo em arquivos é real. Tudo vive em `Icon.tsx`.
- **`Icon.tsx` é a interface**: consumidores usam `<Icon name="trash" />` com contrato `SVGProps<SVGSVGElement> + name: IconName`. Trocar de catálogo (Heroicons, Tabler...) = substituir os paths dentro do mapa, em um arquivo só. Zero alterações em consumidores e testes.
- **Nomes neutros de vendor**: `trash` (não `trash-2`), `drag-handle` (função no app, não o desenho `grip-vertical`). A interface não carrega vocabulário do Lucide.
- **Tipagem exaustiva**: `IconName = keyof typeof paths` dá autocomplete e erro de compilação para nome inexistente; `CATEGORY_ICONS: Record<Category, IconName>` quebra o `tsc` se uma categoria nova ficar sem ícone.
- **Ícone por categoria, não por tipo**: 10 categorias cobrem os 31 tipos de input. Inputs da mesma categoria repetem o ícone.

## Padrões do código a espelhar

| Categoria | Fonte | Padrão |
|---|---|---|
| Componentes | `src/components/dnd/DragOverlayCard.tsx` | `export function Nome(props)`, arquivo PascalCase, `interface Props` local |
| Imports | todo o projeto | Alias `@/` (ex.: `@/components/...`) |
| Acessibilidade | `src/components/dnd/SortableFormItem.tsx:59` | `aria-label` em português nos botões só-ícone (já existem "Arrastar campo", "Remover campo") |
| Estilo | todo o projeto | Tailwind inline, cores `slate`/`blue`/`red` |
| Testes | `src/__tests__/components/Toolbar.test.tsx` | Vitest + RTL em `src/__tests__/components/`, descrições em português, queries por texto/aria |
| Lint | `biome.json` + `pnpm lint` | Biome 2.x + `tsc --noEmit` |

## Design do componente

```tsx
// src/components/icons/Icon.tsx — único arquivo de ícones
const paths = {
  "drag-handle": <>…</>,   // paths copiados do Lucide, atributos em camelCase JSX
  x: <>…</>,
  // …16 entradas
};

export type IconName = keyof typeof paths;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}

export const CATEGORY_ICONS: Record<Category, IconName> = { … };
```

- `stroke="currentColor"` → cor herdada do CSS do pai
- `aria-hidden="true"` por padrão (decorativos; botões já têm `aria-label`), sobrescrevível via spread
- Spread de `props` permite sobrescrever `width`, `height`, `className`, etc.

## Inventário de ícones (16)

### UI

| Nome | Lucide de origem | Uso |
|---|---|---|
| `drag-handle` | `grip-vertical` | Substitui `⋮⋮` (SortableFormItem) |
| `x` | `x` | Substitui `✕` remover campo (SortableFormItem) |
| `chevron-down` | `chevron-down` | Categoria aberta (LeftPanel, substitui `−`) |
| `chevron-right` | `chevron-right` | Categoria fechada (LeftPanel, substitui `+`) |
| `upload` | `upload` | Botão "Importar" (Toolbar) |
| `download` | `download` | Botão "Exportar JSON" (Toolbar) |
| `trash` | `trash-2` | Botão "Limpar" (Toolbar) |

### Categoria (paleta)

| Categoria | Nome | Lucide de origem |
|---|---|---|
| Texto | `text` | `type` |
| Numerico | `hash` | `hash` |
| Data/Hora | `calendar` | `calendar` |
| Documentos BR | `id-card` | `id-card` |
| Endereco | `map-pin` | `map-pin` |
| Contato | `phone` | `phone` |
| Avancado | `sliders` | `sliders-horizontal` |
| Upload | `upload` | reuso do ícone de UI |
| Modal/Lookup | `app-window` | `app-window` |
| Selecao | `list` | `list` |

## Arquivos a alterar

| Arquivo | Ação | Por quê |
|---|---|---|
| `src/components/icons/Icon.tsx` | CREATE | Componente `Icon`, mapa `paths` (16 ícones), `IconName`, `CATEGORY_ICONS` |
| `src/components/dnd/SortableFormItem.tsx` | UPDATE | `⋮⋮` → `<Icon name="drag-handle" />`, `✕` → `<Icon name="x" />` |
| `src/components/layout/LeftPanel.tsx` | UPDATE | `−`/`+` → chevrons |
| `src/components/layout/Toolbar.tsx` | UPDATE | Ícone + texto nos 3 botões |
| `src/components/dnd/DraggableInput.tsx` | UPDATE | Ícone da categoria à esquerda do label |
| `src/__tests__/components/Icons.test.tsx` | CREATE | Smoke test do `Icon` + DraggableInput |

## Tasks

### Fase 1 — Componente Icon
- **Ação**: Criar `src/components/icons/Icon.tsx` com mapa `paths`, tipo `IconName`, componente `Icon` e `CATEGORY_ICONS`
- **Espelhar**: Componente funcional nomeado, arquivo PascalCase
- **Validar**: `pnpm lint`

### Fase 2 — Substituir unicode existente
- **Ação**: `SortableFormItem.tsx`: `⋮⋮` → `<Icon name="drag-handle" width={16} height={16} />`, `✕` → `<Icon name="x" width={16} height={16} />`. `LeftPanel.tsx`: ternário `−`/`+` → `<Icon name="chevron-down" />` / `<Icon name="chevron-right" />` (14px)
- **Espelhar**: Manter classes de hover/opacity e `aria-label`s existentes
- **Validar**: `pnpm test` (testes de CanvasPanel usam `aria-label`s, que não mudam)

### Fase 3 — Toolbar com ícone + texto
- **Ação**: `upload`, `download`, `trash` (14px) à esquerda do texto dos botões, com `flex items-center gap-1.5`
- **Restrição**: Textos "Importar"/"Exportar JSON"/"Limpar" **mantidos** — `Toolbar.test.tsx` consulta por `getByText`
- **Validar**: `pnpm test`

### Fase 4 — Ícones de categoria na paleta
- **Ação**: `DraggableInput.tsx` renderiza `<Icon name={CATEGORY_ICONS[entry.category]} />` (14px, `text-slate-400`) à esquerda de `entry.label`
- **Restrição**: `registry.ts` permanece dados puros (sem JSX)
- **Validar**: `pnpm test` (testes de paleta consultam por texto, não quebram)

### Fase 5 — Teste e verificação final
- **Ação**: `Icons.test.tsx`: renderiza `Icon`, verifica `aria-hidden` e repasse de props (`width`, `className`); verifica que `DraggableInput` renderiza ícone junto do label. Rodar suíte completa + lint + build
- **Validar**: comandos abaixo

## Validação

```bash
pnpm lint                       # tsc --noEmit
npx biome check src/components src/__tests__
pnpm test                       # vitest run
pnpm build                      # tsc -b && vite build
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Teste existente quebrar por mudança visual | Baixa | Textos e `aria-label`s preservados; testes consultam por eles, não pelos glifos unicode |
| Atributos SVG em kebab-case passarem despercebidos | Baixa | `tsc` + Biome acusam; template único revisado uma vez |
| Drag handle mudar de tamanho e afetar hit-area do dnd-kit | Baixa | Manter padding do botão; ícone 16px ≈ tamanho do `⋮⋮` atual |
| Categoria nova criada sem ícone | Baixa | `Record<Category, IconName>` quebra o `tsc` se o mapa ficar incompleto |
| Bundle incluir ícones não usados | Irrelevante | 16 ícones ≈ 3 KB total antes de gzip |

## Fora de escopo

- Ícone **por tipo** de campo (31 tipos) — incremento futuro se a distinção por categoria não bastar
- Ícones no `DragOverlayCard` e no `CanvasPanel` — podem reusar `CATEGORY_ICONS` depois

## Acceptance

- [ ] Todos os 16 ícones no mapa `paths` de `Icon.tsx`, nomes neutros de vendor
- [ ] Nenhuma dependência nova no `package.json`
- [ ] Unicode (`⋮⋮`, `✕`, `−`/`+`) totalmente substituído
- [ ] Toolbar com ícone + texto, textos preservados
- [ ] Paleta com ícone de categoria ao lado de cada input
- [ ] `pnpm lint`, `pnpm test` e `pnpm build` passando
