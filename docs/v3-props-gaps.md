# Lacunas de props entre o builder e a populis-v3-core

> Levantamento feito em 2026-07-30 comparando `populis-v3-core/interfaces/` com os
> schemas do builder (`src/schemas/base.schema.ts` e `src/schemas/inputs.schema.ts`),
> durante o planejamento da importação do formato v3 (`FormSourceItem[]`).
>
> Contexto: os schemas de props usam `z.object` no modo padrão do Zod, que
> **remove chaves desconhecidas sem erro**. Sem mitigação, importar um formulário
> v3 real e re-exportá-lo perderia as props abaixo silenciosamente.

## Nível do item (`IFormSourceItem`)

| Prop v3 | Situação no builder |
| --- | --- |
| `action` | Não existe no `Field` interno — ignorada no import |
| `group` | Não existe no `Field` interno — ignorada no import |
| `methods` | Callbacks (funções) — não sobrevivem a JSON; irrelevante para o builder |

## Props base (`IBaseInputProperties`)

Quase tudo coberto por `BaseInputPropsSchema`. Exceções:

| Prop v3 | Situação no builder |
| --- | --- |
| `id` (da prop, não do field) | Não declarada |
| `submit` | Aparece em várias interfaces (`dynamic-select`, `input-modal`, `input-cep-modal`) e não existe no builder |
| `min` / `max` | Divergência de tipo: `number` na v3, `string` no builder (conversão tratada no import/export) |

## Por tipo

### `dynamic-select` (`IDynamicSelectProperties`) — a lacuna mais crítica

Builder declara apenas `entity`, `fields`, `filters` (+ base). Não declaradas:

| Prop v3 | Observação |
| --- | --- |
| `redirectFields` | **Comportamento essencial** — resolvida no plano de import (declarada no schema + `RedirectFieldsEditor`) |
| `allowFields` | Par de `redirectFields`; candidata a ser declarada junto |
| `conditions` | **Comportamento essencial** (exibição condicional) — sem editor no builder |
| `defaultFilters` | Sem editor |
| `selected` | Sem editor |
| `reactive` | Sem editor |
| `forceSelection` | Sem editor |
| `submit` | Sem editor |

### `input-modal` (`IInputModalProperties`)

Builder declara `entity` (obrigatória — export barra vazia, desde 2026-08-12),
`allowFields`, `redirectFields`, `modalProps` (+ base). Não declaradas:

| Prop v3 | Observação |
| --- | --- |
| `components` | **Essencial** — define os filtros do modal |
| `crudPanel` | Configuração do painel |
| `filters` | Consulta ao backend |
| `item` | Render do item selecionado |
| `format`, `submit`, `textArea`, `useAutocomplete`, `autocompleteProps` | Diversos |

Obs.: `modalProps` existe no builder mas **não** na interface v3 — verificar se é
legado/inventado e se deve ser removido ou mapeado para algo real.

### `input-cep-modal` (`IInputModalCepProperties`)

| Prop v3 | Observação |
| --- | --- |
| `redirectFields` | Mesmo caso do dynamic-select; candidata à mesma solução |
| `allowFields` | Idem |
| `submit` | Sem editor |

### `select-search` (`ISelectSearchProperties`)

| Prop v3 | Observação |
| --- | --- |
| `sourceType` | Sem editor |
| `preset` | Sem editor |

Obs.: `expand`, `optionLabel`, `optionValue` do builder não existem na interface v3 —
verificar origem.

### Cobertos (sem lacuna relevante)

`input-attach`/upload, selects estáticos (`source`), props de teclado
(`keyboardOptions` é `z.record` aberto).

## Conclusão e decisão tomada

Sem mudança nos schemas, importar um formulário v3 com `dynamic-select` ou
`input-modal` configurados perderia comportamento crítico (`conditions`,
`redirectFields`, `components`, `crudPanel`) sem aviso, e o re-export sairia
quebrado.

Decisão aplicada junto com a feature de import:

1. **`.passthrough()`** nos schemas de props (`wrap()` em `inputs.schema.ts`):
   props desconhecidas atravessam import → store → export intactas (não ficam
   editáveis no painel, mas não são perdidas).
2. **`redirectFields` declarada no schema do `dynamic-select`** (e editor já
   existente `RedirectFieldsEditor` renderiza automaticamente quando a prop está
   presente).

## Próximos passos sugeridos (backlog)

- [ ] Declarar `allowFields` no `dynamic-select` (par de `redirectFields`).
- [ ] Declarar `redirectFields`/`allowFields` no `input-cep-modal`.
- [ ] Editor para `conditions` do `dynamic-select` (exibição condicional).
- [ ] Suporte a `components`/`crudPanel`/`item` do `input-modal` (ou ao menos
      editor JSON genérico consciente dessas chaves).
- [ ] Decidir destino de `submit` (comum a vários tipos) e `id` de prop.
- [ ] Suporte a `action`/`group` no nível do item (hoje ignorados no import).
- [ ] Auditar props do builder sem correspondência na v3 (`modalProps`,
      `expand`, `optionLabel`, `optionValue`, `placeholder`?, `doNotTranslate`?,
      `requestFocus`?) — remover ou documentar.
- [ ] `sourceType`/`preset` do `select-search`.