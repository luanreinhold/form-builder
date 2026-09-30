# Plan: `checkbox-component` (Checkbox)

**Source PRD**: N/A (modo conversacional — `/ecc:plan`)
**Selected Milestone**: Adicionar o 28º tipo de campo à paleta — `checkbox-component`, categoria **Seleção**, rótulo **Checkbox**
**Complexity**: Small (~1,5–3h)

## Summary
Adicionar o tipo `checkbox-component` ao builder: schema Zod, entrada no `REGISTRY` (categoria `selecao`, label `Checkbox`), preview visual próprio (caixa + label ao lado, em vez do label acima do controle) e nome amigável da prop `checked` nas mensagens de erro. O campo é um input normal da v3 (tem `name`), então o `PropEditor` genérico já o atende: `checked` cai automaticamente na seção **Específicas do Input** como `BooleanEditor`, e `readonly` já existe em `BaseInputPropsSchema`.

## Contrato v3 (informado pelo usuário)

```ts
export interface ICheckboxProperties {
	label: string;
	checked?: boolean;
	readonly?: boolean;
}
```

```json
{
	"type": "checkbox-component",
	"class": "d-block col-sm-2 mb-2",
	"props": {
		"label": "Equipe",
		"checked": true,
		"name": "funcionariosEquipe"
	}
}
```

Leitura do contrato para o builder:
- `name` aparece no exemplo de JSON → o componente **é** um input (estende `InputBaseComponent`), diferente de `divider-component`. Portanto `props` = `BaseInputPropsSchema.extend({ checked })` e **não** um objeto solto.
- `readonly` já está em [base.schema.ts:14](src/schemas/base.schema.ts#L14) — não redeclarar.
- `label` é obrigatório na interface v3, mas segue `optional()` no builder (como em todos os outros tipos) para não derrubar rascunhos meio-preenchidos na reidratação. O padrão do projeto é barrar no export apenas o que quebra a v3 em runtime (ver `entity` em [exportForm.ts](src/utils/exportForm.ts)); `label` vazio não quebra — fica de fora do gate de export.
- Única prop específica nova: `checked?: boolean`.

## Patterns to Mirror
| Category | Source | Pattern |
|---|---|---|
| Schema | [inputs.schema.ts:130](src/schemas/inputs.schema.ts#L130) (`Radio`) | `wrap("<type>", BaseInputPropsSchema.extend({...}))` + comentário explicando a semântica v3 + entrada no `discriminatedUnion` e em `FIELD_TYPES` |
| Registry | [registry.ts:169-179](src/components/inputs/registry.ts#L169-L179) (`radio-component`) | `{ type, label, category, defaultProps: { ...baseDefaults("<name>"), <especificas> } }` |
| Preview | [InputPreview.tsx:66-67](src/components/inputs/InputPreview.tsx#L66) + `renderRadio` | `case` no `switch` de `renderControl` / early-return para layout fora do padrão label-acima |
| Nomes de props | [formatErrors.ts](src/utils/formatErrors.ts) `PROP_NAMES` | Chave da prop → rótulo PT exibido ao Consultor |
| Tests | [inputs.test.ts:189-256](src/__tests__/schemas/inputs.test.ts#L189-L256), [InputPreview.test.tsx:235](src/__tests__/components/InputPreview.test.tsx#L235) | Vitest + RTL, descrições em PT, `makeField(type, props)` |

Nada a inventar: `checkbox-component` é estruturalmente idêntico a `radio-component` (input da categoria Seleção com preview customizado), só com menos props.

## Files to Change
| File | Action | Why |
|---|---|---|
| `src/schemas/inputs.schema.ts` | UPDATE | Declarar `CheckboxProps`/`Checkbox`, incluir no `discriminatedUnion` e em `FIELD_TYPES` |
| `src/components/inputs/registry.ts` | UPDATE | Entrada `checkbox-component` → categoria `selecao`, label `Checkbox`, `defaultProps` |
| `src/components/inputs/InputPreview.tsx` | UPDATE | Preview com caixa à esquerda + label ao lado (layout próprio, sem o `<span>` de label acima) |
| `src/utils/formatErrors.ts` | UPDATE | `PROP_NAMES.checked = "Marcado"` |
| `src/__tests__/schemas/inputs.test.ts` | UPDATE | Aceitar/rejeitar props, passthrough |
| `src/__tests__/components/InputPreview.test.tsx` | UPDATE | Render do preview (marcado/desmarcado, label, sem asterisco duplicado) |
| `src/__tests__/utils/exportImport.test.ts` | UPDATE | Round-trip com o JSON do exemplo |
| `README.md` | UPDATE | 27 → 28 tipos (linhas 172, 229, 406) e tabela da categoria **Seleção** (linha 417) |

Sem mudanças em `PropEditor.tsx`, `specificEditors.tsx`, `categories.ts`, `Icon.tsx`, `exportForm.ts`, `importForm.ts` ou store — todos são genéricos por tipo e já cobrem o novo campo.

## Tasks

### Task 1: Schema
- **Action**: Em [inputs.schema.ts](src/schemas/inputs.schema.ts), após `Radio`:
  ```ts
  // checkbox-component estende InputBaseComponent (tem `name`), ao contrario do
  // divider. `checked` e o estado inicial da caixa (ICheckboxProperties da v3);
  // `readonly` ja vem da base. Nao ha `source` — e um unico booleano.
  const CheckboxProps = BaseInputPropsSchema.extend({
    checked: z.boolean().optional(),
  });
  const Checkbox = wrap("checkbox-component", CheckboxProps);
  ```
  Adicionar `Checkbox` ao `discriminatedUnion` e `"checkbox-component"` a `FIELD_TYPES` (ambos ao lado de `radio-component`, mantendo a ordem da paleta).
- **Mirror**: `Radio` em `inputs.schema.ts:114-130`.
- **Validate**: `pnpm test -- inputs`

### Task 2: Registry
- **Action**: Em [registry.ts](src/components/inputs/registry.ts), após `radio-component`:
  ```ts
  "checkbox-component": {
    type: "checkbox-component",
    label: "Checkbox",
    category: "selecao",
    defaultProps: { ...baseDefaults("checkbox"), checked: false },
  },
  ```
  Efeito colateral desejado: `FIELD_TYPE_NAMES` em `formatErrors.ts` deriva do `REGISTRY`, então "Checkbox" passa a aparecer nas mensagens de erro sem trabalho extra.
- **Mirror**: `radio-component` em `registry.ts:169-179`.
- **Validate**: `pnpm test -- registry` (o teste existente já exige cobertura de todo `FIELD_TYPES` e `defaultProps.name` preenchido).

### Task 3: Preview
- **Action**: Em [InputPreview.tsx](src/components/inputs/InputPreview.tsx), adicionar early-return antes do wrapper padrão (junto ao de `divider-component`), porque o checkbox tem a caixa **antes** do texto:
  ```tsx
  if (field.type === "checkbox-component") {
    return renderCheckbox(props, entry.label);
  }
  ```
  `renderCheckbox` renderiza `<label className="flex cursor-not-allowed items-center gap-1.5 ...">` com `<input type="checkbox" className="h-4 w-4" checked={props.checked === true} readOnly disabled />` + `<span>{label}</span>`, mantendo `required` como `*` em `text-danger` e o `hint` abaixo (mesmas classes do bloco padrão).
- **Mirror**: `renderRadio` (`InputPreview.tsx:137-164`) para a estrutura do `<label>`/`checked`/`readOnly`; `renderDivider` para o padrão de early-return.
- **Validate**: `pnpm test -- InputPreview` + conferência visual arrastando o campo no canvas.

### Task 4: Nome amigável da prop
- **Action**: Em [formatErrors.ts](src/utils/formatErrors.ts), no bloco `// selecao / busca` de `PROP_NAMES`, adicionar `checked: "Marcado",`.
- **Mirror**: `selected: "Opção selecionada"` na mesma lista.
- **Validate**: `pnpm test -- formatErrors`

### Task 5: Testes
- **Action**:
  - `inputs.test.ts`: aceita `checkbox-component` com `{ name, label, checked }`; aceita sem `checked` (opcional); rejeita `checked` não-booleano; rejeita sem `name` (é input); preserva prop desconhecida via passthrough.
  - `InputPreview.test.tsx`: renderiza `role="checkbox"` desmarcado por padrão; marcado quando `checked: true`; exibe o `label`; exibe `*` quando `required`.
  - `exportImport.test.ts`: importa o JSON do exemplo do usuário e faz round-trip preservando `checked`, `label` e `name`.
- **Mirror**: blocos `describe("radio-component")` já existentes nos três arquivos.
- **Validate**: `pnpm test`

### Task 6: README
- **Action**: Atualizar "27 tipos" → "28 tipos" (linhas 172, 229, 406) e incluir `checkbox-component` na linha da categoria **Seleção** (linha 417). Na nota da linha 425, mencionar que `checkbox-component` usa um único booleano `checked` (sem `source`).
- **Mirror**: entradas já existentes das mesmas tabelas.
- **Validate**: leitura do diff.

## Validation
```bash
pnpm lint      # tsc --noEmit — a discriminated union deve fechar sem erro
pnpm test
pnpm build
```

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| `class` do exemplo usa `col-sm-2`, mas import/export do builder só entendem `col-md-N` ([importForm.ts:16](src/utils/importForm.ts#L16)) — o round-trip resulta em `d-block col-sm-2 mb-2 col-md-12` | Alta (comportamento **já existente**, não introduzido aqui) | Fora do escopo deste plano; o teste de round-trip deve assertar o comportamento atual (classe custom preservada + `col-md-12` anexado), não um comportamento novo. Se incomodar, abrir plano separado para suporte a `col-sm/col-lg` |
| `label` obrigatório na `ICheckboxProperties` mas opcional no schema do builder | Média | Decisão consciente e consistente com os outros 27 tipos; preview cai no fallback `name` → label da paleta. Se for preciso barrar no export, é um item separado que afeta todos os tipos |
| Preview fora do padrão (caixa antes do texto) divergir visualmente do resto do canvas | Baixa | Reusar exatamente as classes do `renderRadio`, que já resolve esse layout |
| Esquecer uma das listas paralelas (`discriminatedUnion` + `FIELD_TYPES` + `REGISTRY`) | Baixa | `tsc --noEmit` quebra em `REGISTRY: Record<FieldType, ...>` e o teste `registry.test.ts` compara os totais por categoria |

## Acceptance
- [ ] `checkbox-component` aparece na paleta sob **Seleção** com o rótulo **Checkbox** e pode ser arrastado para o canvas
- [ ] Preview mostra a caixa marcada/desmarcada conforme `checked`, com o label ao lado
- [ ] Painel de props edita `name`, `label`, `readonly` (base) e `checked` (Específicas do Input)
- [ ] Export gera exatamente `{ "type": "checkbox-component", "class": ..., "props": { label, checked, name } }`
- [ ] Import do JSON de exemplo funciona e o round-trip preserva as props
- [ ] `pnpm lint`, `pnpm test` e `pnpm build` passam
- [ ] README reflete 28 tipos e a categoria atualizada
