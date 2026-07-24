# Plan: Remover 4 inputs do form-builder

**Origem**: Solicitação free-form (`/ecc:plan`)
**Complexidade**: Small
**Escopo**: somente `src/` + `README.md` — `populis-v3-core/` é repositório de consulta/legado e **fica de fora** (será excluído eventualmente; não entra no build do Vite nem no `include` do `tsconfig.app.json`)

## Resumo

Remover por completo os tipos `input-date-calendar`, `input-photography`, `input-attach-base64` e `input-file` do form-builder React/TS: schema Zod, registry (paleta), preview visual e documentação. `input-attach` **permanece** — portanto a categoria **Upload** continua existindo.

## Pesquisa — onde os inputs são usados (escopo `src/`)

| Arquivo | Referências |
|---|---|
| `src/schemas/inputs.schema.ts` | consts `DateCalendar`, `FileInput`, `AttachBase64`, `Photography`; entradas no `discriminatedUnion`; itens no array `FIELD_TYPES` |
| `src/components/inputs/registry.ts` | entradas `"input-date-calendar"`, `"input-file"`, `"input-attach-base64"`, `"input-photography"` no `REGISTRY` |
| `src/components/inputs/InputPreview.tsx` | `case`s no `switch renderControl()` |
| `README.md` | tabela de tipos (linhas das categorias Data/Hora e Upload) |
| `src/types/index.ts` | apenas re-exporta `FieldType`/`FIELD_TYPES` — **derivado, sem alteração** |

Os testes (`src/__tests__/`) iteram sobre `FIELD_TYPES` e `listByCategory()` de forma genérica — não há referência hardcoded aos 4 tipos, então nenhum assert quebra.

## Arquivos a alterar

| Arquivo | Ação | Por quê |
|---|---|---|
| `src/schemas/inputs.schema.ts` | UPDATE | Remover consts `DateCalendar`, `FileInput`, `AttachBase64`, `Photography`; remover do `FieldSchema` (`discriminatedUnion`); remover do array `FIELD_TYPES` |
| `src/components/inputs/registry.ts` | UPDATE | Remover as 4 entradas correspondentes do `REGISTRY` |
| `src/components/inputs/InputPreview.tsx` | UPDATE | Remover `case "input-date-calendar"`; no bloco de arquivo manter só `case "input-attach"`, removendo `input-file` / `input-attach-base64` / `input-photography` |
| `README.md` | UPDATE | Data/Hora → `input-date`, `input-time`; Upload → `input-attach` |

## Tarefas

### Task 1: Schema Zod (`src/schemas/inputs.schema.ts`)
- **Ação**: remover as 4 declarações `wrap(...)`, suas entradas no `z.discriminatedUnion("type", [...])` e os 4 strings do array `FIELD_TYPES`.
- **Mirror**: manter a ordem/estilo das declarações existentes; `FIELD_TYPES` deve continuar satisfazendo `readonly FieldType[]`.
- **Validate**: `pnpm tsc --noEmit` (o `satisfies` falha se array e union divergirem).

### Task 2: Registry / paleta (`src/components/inputs/registry.ts`)
- **Ação**: remover as 4 chaves do objeto `REGISTRY`.
- **Mirror**: `REGISTRY` é `Record<FieldType, RegistryEntry>` — deve casar exatamente com o `FieldType` resultante da Task 1 (alteração atômica com a Task 1).
- **Validate**: `pnpm tsc --noEmit` (chave faltante/sobrando vira erro de tipo).

### Task 3: Preview (`src/components/inputs/InputPreview.tsx`)
- **Ação**: remover o `case "input-date-calendar"` e os 3 `case`s de upload removidos, deixando `case "input-attach"` com seu `return`.
- **Mirror**: respeitar `noFallthroughCasesInSwitch` — todo `case` remanescente termina com `return`.
- **Validate**: `pnpm tsc --noEmit` + `pnpm biome check src`.

### Task 4: Documentação (`README.md`)
- **Ação**: atualizar a tabela de tipos — Data/Hora sem `input-date-calendar`; Upload só com `input-attach`.
- **Validate**: revisão visual da tabela.

## Validação final

```bash
pnpm tsc --noEmit
pnpm vitest run
pnpm biome check src
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Divergência entre `FIELD_TYPES`, `discriminatedUnion` e `REGISTRY` | Média | Editar schema + registry numa única passada; `tsc` acusa qualquer descasamento |
| Fallthrough no `switch` do preview | Baixa | Manter `return` em cada `case` remanescente |
| Formulários salvos localmente com os tipos removidos passam a falhar no parse Zod | Baixa | Aceitável — remoção total é o objetivo; sem migração necessária (estado local) |

## Aceitação

- [ ] Os 4 tipos não existem mais em schema, registry e preview
- [ ] Categoria Upload mantida com `input-attach`; Data/Hora mantida com `input-date`/`input-time`
- [ ] `pnpm tsc --noEmit` e `pnpm vitest run` verdes
- [ ] README reflete a paleta atual
- [ ] `populis-v3-core/` intocado

---

# Plan (adendo): Remover categoria "Endereco" e o input `input-cep`

**Origem**: Solicitação free-form (`/ecc:plan`) — 2026-06-15
**Complexidade**: Small
**Escopo**: somente `src/` + `README.md` — `populis-v3-core/` **fica de fora** (confirmado pelo usuário)

## Resumo

Remover por completo o tipo `input-cep` do form-builder (schema Zod, registry, type union, ícone de categoria e documentação) e, por consequência, a categoria **`Endereco`** — que tem `input-cep` como único membro. `input-cep-modal` **permanece** (categoria `Modal/Lookup`, confirmado pelo usuário).

## Pesquisa — onde aparecem (escopo `src/` + README)

| Arquivo | Referências |
|---|---|
| `src/components/inputs/registry.ts` | entrada `"input-cep"` (L97-102), `category: "Endereco"` |
| `src/schemas/inputs.schema.ts` | const `Cep` (L46); item no `discriminatedUnion` (L120); string em `FIELD_TYPES` (L154) |
| `src/types/index.ts` | `"Endereco"` na union `Category` (L12) |
| `src/components/icons/Icon.tsx` | `Endereco: "map-pin"` em `CATEGORY_ICONS` (L169) |
| `README.md` | linha da tabela `**Endereço** \| input-cep` (L375) + contagem (L367) |

Os testes (`src/__tests__/`) iteram sobre `FIELD_TYPES`, `REGISTRY` e `CATEGORY_ICONS` genericamente — sem referência hardcoded a `input-cep`/`Endereco`, nenhum assert quebra. `InputPreview.tsx` não tem `case` para `input-cep` (cai no `default`), não precisa de alteração.

## Arquivos a alterar

| Arquivo | Ação | Por quê |
|---|---|---|
| `src/components/inputs/registry.ts` | UPDATE | Remover entrada `"input-cep"` (L97-102) |
| `src/schemas/inputs.schema.ts` | UPDATE | Remover const `Cep` (L46), `Cep` do `discriminatedUnion` (L120), `"input-cep"` de `FIELD_TYPES` (L154) |
| `src/types/index.ts` | UPDATE | Remover `\| "Endereco"` da union `Category` (L12) |
| `src/components/icons/Icon.tsx` | UPDATE | Remover `Endereco: "map-pin"` de `CATEGORY_ICONS` (L169) — obrigatório: `Record<Category, IconName>` deixa de aceitar a chave |
| `README.md` | UPDATE | Remover linha `**Endereço** \| input-cep`; ajustar contagem de tipos/categorias |

## Tarefas

### Task A: Registry (`src/components/inputs/registry.ts`)
- **Ação**: remover o bloco `"input-cep": { ... }` (L97-102).
- **Validate**: `pnpm tsc --noEmit`.

### Task B: Schema Zod (`src/schemas/inputs.schema.ts`)
- **Ação**: remover `const Cep`, `Cep,` do `discriminatedUnion` e `"input-cep",` de `FIELD_TYPES`.
- **Validate**: `pnpm tsc --noEmit` (o `satisfies` falha se array e union divergirem).

### Task C: Type `Category` (`src/types/index.ts`)
- **Ação**: remover `| "Endereco"` da union `Category`.

### Task D: Ícone de categoria (`src/components/icons/Icon.tsx`)
- **Ação**: remover `Endereco: "map-pin",` de `CATEGORY_ICONS`. Manter o path `"map-pin"` (ícone reutilizável).
- **Validate**: `pnpm tsc --noEmit`.

### Task E: Documentação (`README.md`)
- **Ação**: remover a linha `**Endereço** | input-cep`; ajustar a contagem de tipos/categorias.

## Validação final

```bash
pnpm tsc --noEmit
pnpm vitest run
pnpm biome check src
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Divergência entre `FIELD_TYPES`, `discriminatedUnion` e `REGISTRY` | Média | Editar schema + registry numa única passada; `tsc` acusa descasamento |
| `Record<Category, IconName>` quebra build se `Icon.tsx` não atualizado junto | Alta | Task D atômica com Task C |
| `input-cep-modal` removido por engano | Baixa | Mantido explicitamente (Modal/Lookup) |
| Forms salvos localmente com `type: "input-cep"` falham no parse Zod | Baixa | Aceitável — remoção total é o objetivo |

## Aceitação

- [ ] `input-cep` não existe mais em schema, registry, `FIELD_TYPES`
- [ ] Categoria `Endereco` removida de `Category` e `CATEGORY_ICONS`
- [ ] `input-cep-modal` preservado
- [ ] `pnpm tsc --noEmit` e `pnpm vitest run` verdes
- [ ] README reflete a paleta atual
- [ ] `populis-v3-core/` intocado