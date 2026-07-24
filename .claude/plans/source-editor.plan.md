# Plan: Editor visual de `source` (Select)

**Source PRD**: N/A (modo conversacional — `/ecc:plan`)
**Selected Milestone**: Substituir o JsonEditor genérico do prop `source` por um editor visual
**Complexity**: Small–Medium (~2–4h)

## Summary
Os selects (`select-search`, `select-multiple`, `dynamic-select`) hoje editam o prop `source` por um textarea JSON genérico, exigindo digitar/colar um array de objetos à mão. Este plano cria um `SourceEditor` visual com campos Rótulo/Valor, botão Adicionar, lista editável e reordenável, checkbox de pré-seleção, e um modo alternável Formulário ⇄ JSON para preservar o fluxo atual de colar um `source` inteiro.

## Semântica confirmada (do componente real)
- `key` = **rótulo exibido/filtrado** (ex.: `"Código CID"`) — ver `select-search.component.ts:260-261` e `:389-391`.
- `value` = **valor armazenado/emitido** (ex.: `"CID"`) — `emitEvent(item.value, item.key)`.
- `selected` = item pré-selecionado.
- Formato alvo (igual ao exemplo do usuário e à interface `ISelect`):
  ```json
  [
    { "key": "Código CID", "value": "CID", "selected": true },
    { "key": "Descrição da doença", "value": "DESC" }
  ]
  ```

## Decisões do usuário
1. **Preservar** o modo de colar JSON → toggle **Formulário ⇄ JSON**.
2. **Manter** edição inline (item 2) e reordenação ↑/↓ (item 3) já nesta versão.
3. `selected` = **checkbox simples** (sem lógica rádio/múltiplo por tipo de select).

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Editor de prop | `src/components/props/editors/StringEditor.tsx`, `BooleanEditor.tsx` | Props `{ label, value, onChange }`; `<label>` + `<span className="...text-muted-foreground">`; classes `border-edge-input` / `focus:ring-ring-soft` |
| Botão | `src/components/ui/Button.tsx` | `variant`/`size` (ex.: `danger-solid`, `sm`) |
| Estado/validação local | `src/components/props/editors/JsonEditor.tsx:10-31` | `useState` + `useEffect([value])` para ressincronizar; erro inline em `text-danger` |
| Tests | `src/__tests__/components/Button.test.tsx` | Vitest + Testing Library, descrições em PT, `fireEvent` / `screen.getByRole` |

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/components/props/editors/SourceEditor.tsx` | CREATE | Editor visual (campos + botão + lista editável/reordenável + toggle JSON) |
| `src/components/props/PropEditor.tsx` | UPDATE | Override: `key === "source"` → renderizar `SourceEditor` em vez de `JsonEditor` |
| `src/schemas/inputs.schema.ts` | UPDATE | Estender `SelectSourceItem` com `selected?: boolean` e `icon?: string` (alinhar à `ISelect`) |
| `src/__tests__/components/SourceEditor.test.tsx` | CREATE | Cobrir adicionar/remover/editar/reordenar/validação/toggle |

## Tasks

### Task 1: Schema — preservar `selected`/`icon`
- **Action**: Em `src/schemas/inputs.schema.ts`, estender `SelectSourceItem`:
  `key: z.union([z.string(), z.number()])`, `value: z.string()`, `selected: z.boolean().optional()`, `icon: z.string().optional()`.
- **Mirror**: Definição existente em `inputs.schema.ts:88-91`.
- **Validate**: `npm run test -- inputs` (o array com `selected:true` deve passar e não perder o campo).

### Task 2: Componente `SourceEditor`
- **Action**: Criar `src/components/props/editors/SourceEditor.tsx` com props `{ label, value, onChange }`, tratando `value` como `ISelect[]` (normaliza `undefined → []`). Conteúdo:
  - **Linha de entrada**: input "Rótulo (exibido)" (key) + input "Valor (armazenado)" (value) + checkbox "Pré-selecionado" + botão "Adicionar". Placeholders do exemplo: `Código CID` / `CID`. Enter no campo de valor aciona Adicionar. Se "Valor" vazio ao adicionar, copiar do "Rótulo".
  - **Lista abaixo**: cada item com edição inline de key/value, checkbox `selected`, botões ↑/↓ (reordenar) e remover.
  - **Toggle Formulário ⇄ JSON**: alterna para um textarea reaproveitando a lógica do `JsonEditor` (parse + erro inline), preservando o fluxo de colar um source inteiro.
  - Toda mudança emite `onChange(novoArray)`.
  - **Validações**: bloquear adicionar com key/value vazio; avisar em `value` duplicado (erro inline `text-danger`).
- **Mirror**: `StringEditor.tsx` (inputs), `BooleanEditor.tsx` (checkbox), `JsonEditor.tsx` (parse/erro), `Button.tsx` (ações).
- **Validate**: `npm run test -- SourceEditor` e checagem visual no painel de props.

### Task 3: Integração no PropEditor
- **Action**: Em `src/components/props/PropEditor.tsx`, dentro do `specifics.map`, antes do switch de `kind`, tratar `key === "source"` → renderizar `SourceEditor`. Manter o restante (`json`/`boolean`/`number`/`string`) intacto.
- **Mirror**: Bloco `if (kind === "json")` em `PropEditor.tsx:156-165`.
- **Validate**: `npm run build` + abrir um `select-search` no editor e confirmar o novo editor.

### Task 4: Testes
- **Action**: `src/__tests__/components/SourceEditor.test.tsx` cobrindo: adicionar item, remover item, editar inline, reordenar ↑/↓, ignorar entrada vazia, marcar `selected`, alternar para modo JSON e voltar, renderizar `value` pré-existente.
- **Mirror**: `Button.test.tsx` (estilo Vitest/RTL em PT).
- **Validate**: `npm run test`.

## Validation
```bash
npm run test
npm run build
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Confusão key/value (rótulo vs valor) | Média | Rotular "Rótulo (exibido)" / "Valor (armazenado)" com placeholders `Código CID` / `CID` |
| Perder fluxo de colar JSON | Média | Toggle Formulário ⇄ JSON (decisão #1) |
| `selected`/`icon` descartados na validação | Alta (já ocorre hoje) | Task 1 corrige o schema |
| Reordenação/edição inline introduzir bug de índice | Baixa | Operar por índice imutável e cobrir com testes (Task 4) |

## Acceptance
- [ ] Editor visual aparece para o prop `source` dos três selects
- [ ] Adicionar, remover, editar inline e reordenar funcionam e emitem `onChange` correto
- [ ] Checkbox `selected` persiste no JSON exportado
- [ ] Toggle Formulário ⇄ JSON preserva o fluxo de colar um source inteiro
- [ ] `npm run test` e `npm run build` passam
- [ ] Padrões espelhados dos editores existentes (não reinventados)