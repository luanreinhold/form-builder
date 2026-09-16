# Plan: Padronização de Mensagens de Erro

**Documento de Referência**: [ERRO_MESSAGES_STANDARD.md](../../ERRO_MESSAGES_STANDARD.md)  
**Status**: In Progress  
**Complexity**: Small (4-7 horas)  
**Data**: 2026-09-14

---

## Summary

Implementar um sistema de mensagens de erro **compreensível para Consultores** (não-desenvolvedores) no Form Builder, resolvendo a falha **GER-05** do Plano de Testes. O sistema removerá exposição de estrutura interna JSON, traduzirá completamente para português e referenciará campos pelo rótulo + posição.

---

## Patterns to Mirror

| Categoria | Fonte | Padrão |
|---|---|---|
| Estrutura de Helper | `src/utils/exportForm.ts:11-28` | Funções puras que retornam valores transformados, sem efeitos colaterais |
| Tipos de Resultado | `src/utils/importForm.ts:6` | Union type `{ ok: true; data } \| { ok: false; errors }` |
| Tratamento de Zod | `src/utils/exportForm.ts:60-65` | Usar `.safeParse()` e iterar sobre `.issues` |
| Nomes de Props | `src/types/formSourceItem.ts` | Usar `Record<string, string>` para mapeamentos |
| Testes | `src/__tests__/utils/exportImport.test.ts` | Vitest com assertions diretas |

---

## Files to Change

| Arquivo | Ação | Motivo |
|---|---|---|
| `src/utils/formatErrors.ts` | **CREATE** | Novo arquivo com 5 helpers reutilizáveis |
| `src/utils/exportForm.ts` | **UPDATE** (linhas 64, 79) | Remover caminho JSON, usar helpers |
| `src/utils/importForm.ts` | **UPDATE** (linhas 72, 99) | Remover caminho JSON, traduzir JSON errors |
| `src/__tests__/utils/exportImport.test.ts` | **UPDATE** | Validar ausência de padrões técnicos |

---

## Implementation Tasks

### Phase 1: Criar Helpers de Tradução (formatErrors.ts)
**Objetivo**: Centralizar lógica de formatação e tradução  
**Complexity**: Low  
**Estimate**: 2-3 horas

#### Task 1.1: Criar arquivo base com constantes
- `FIELD_TYPE_NAMES`: Map tipo interno → amigável
- `PROP_NAMES`: Map propriedade → nomenclatura de usuário
- `ZOD_TRANSLATIONS`: Map mensagem Zod → português
- `JSON_ERROR_PATTERNS`: Map erro JSON → diagnóstico

#### Task 1.2: Implementar `formatFieldReference()`
```typescript
function formatFieldReference(field: Field, index: number): string
// Retorna: Campo "Rótulo do Campo" (1º)
```

#### Task 1.3: Implementar 4 funções de tradução
- `formatPropName(prop: string)`
- `formatFieldTypeName(type: string)`
- `translateZodMessage(message: string)`
- `friendlyJsonError(err: Error)`

---

### Phase 2: Atualizar `exportForm.ts`
**Objective**: Remover caminho JSON e nomes internos  
**Complexity**: Low  
**Estimate**: 1-2 horas

#### Task 2.1: Linha 64 — Erros Zod
Remover `${i.path.join(".")}: ${i.message}` e usar `formatFieldReference()` + `translateZodMessage()`

#### Task 2.2: Linhas 71-80 — Entity vazia
Remover `${tipo} sem entity:` e usar `formatFieldReference()` + `formatFieldTypeName()`

---

### Phase 3: Atualizar `importForm.ts`
**Objective**: Remover caminho JSON e traduzir JSON errors  
**Complexity**: Low  
**Estimate**: 1-2 horas

#### Task 3.1: Linha 99 — JSON.parse error
Remover mensagem crua e usar `friendlyJsonError()`

#### Task 3.2: Linhas 70-74 — parseV3List errors
Remover `fields.${i}.${iss.path.join(".")}` e usar `formatFieldReference()`

#### Task 3.3: Linha 66 — Tipo desconhecido
Remover `fields.${i}.type: tipo desconhecido`

---

### Phase 4: Testes
**Objective**: Validar que mensagens nunca exponham caminho JSON  
**Complexity**: Medium  
**Estimate**: 1-2 horas

#### Task 4.1: Criar `src/__tests__/utils/formatErrors.test.ts`
Testes para cada helper de tradução

#### Task 4.2: Atualizar `src/__tests__/utils/exportImport.test.ts`
Validar:
- ✅ Nenhum erro contém `fields.N.props`
- ✅ Nenhum erro contém nomes internos
- ✅ Todos os erros mencionam rótulo + posição
- ✅ Mensagens JSON traduzidas

---

## Validation

```bash
npm test -- formatErrors
npm test -- exportForm
npm test -- importForm
npm test -- exportImport
npm run type-check
npm run lint
```

---

## Risks & Mitigations

| Risco | Prob. | Mitigação |
|---|---|---|
| Índice errado ao referenciar | MÉDIA | Testes múltiplas posições |
| Tradução incompleta | BAIXA | Fallback mensagem original |
| Quebra v3 | MUITO BAIXA | Só altera mensagem |

---

## Acceptance Criteria

- [x] `formatErrors.ts` criado com 5 helpers
- [x] Testes 100% passing
- [x] Nenhuma mensagem contém `fields.N.props`
- [x] Nenhuma mensagem contém nomes internos
- [x] Todas mencionam rótulo + posição
- [x] JSON errors em português
- [x] Sem quebra v3
- [x] GER-05 validável

---

**Status**: ✅ Implementado

Fora do escopo original, mas alterados pelo mesmo motivo:
- `src/store/formStore.ts` — `importJSON` emitia o mesmo caminho JSON no painel de import.
- `src/components/layout/Toolbar.tsx` — chip de status truncado (mensagens ficaram mais longas).
- `src/__tests__/components/Toolbar.test.tsx` — asserção da mensagem de JSON inválido.
