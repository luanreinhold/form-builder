# Componentização por módulos

Guia de referência sobre os benefícios de quebrar componentes grandes em
módulos menores e dados declarativos, em vez de manter um único componente
extenso com JSX repetido e lógica embutida.

> Caso de referência: a refatoração do `src/components/props/PropEditor.tsx`,
> citada ao longo deste documento como exemplo concreto.

## O que mudou no caso de referência

Antes, o `PropEditor` era um único componente que misturava:

- ~50 linhas de `<StringEditor>` repetidos, um por prop;
- um encadeamento de 7 `if`s para escolher qual editor renderizar por prop;
- todas as seções (`Identificacao`, `Texto/Hint`, `Comportamento`, `Especificas`,
  `Wrapper`) inline no mesmo `return`.

Depois, foi quebrado em três frentes:

1. **Sub-componentes por seção** — `EditorHeader`, `StringSections`,
   `BehaviorSection`, `SpecificsSection`, `WrapperSection` e um `SectionTitle`
   reaproveitado.
2. **Módulo de despacho** — `specificEditors.tsx` com mapas (`KEY_EDITORS` por
   nome da prop, `KIND_EDITORS` por tipo) e a função `renderSpecificEditor`.
3. **Dados declarativos** — `STRING_SECTIONS` descreve seções e campos; o JSX
   apenas itera sobre essa config.

O componente raiz virou um "índice" legível:

```tsx
return (
  <div className="space-y-4">
    <EditorHeader type={field.type} onDelete={onDelete} />
    <StringSections props={props} onChangeProp={onChangeProp} />
    <BehaviorSection props={props} onChangeProp={onChangeProp} />
    <SpecificsSection specifics={specifics} props={props} onChangeProp={onChangeProp} />
    <WrapperSection field={field} onChangeMeta={onChangeMeta} />
  </div>
);
```

## Benefícios

### 1. Legibilidade por níveis de abstração

O componente raiz conta **o quê** a tela tem (cabeçalho, seções, wrapper), sem o
ruído do **como** cada parte é montada. Quem abre o arquivo entende a estrutura
em segundos; o detalhe fica em funções menores, lidas só quando necessário.

### 2. Responsabilidade única (SRP)

Cada módulo tem um motivo para mudar:

- mudou o layout do cabeçalho → mexe só em `EditorHeader`;
- mudou a regra de qual editor usar → mexe só em `specificEditors.tsx`;
- mudou o agrupamento de campos → mexe só em `STRING_SECTIONS`.

Isso reduz o risco de uma alteração afetar partes não relacionadas.

### 3. Open/Closed: estender sem reescrever

Adicionar um editor novo por tipo de prop é **acrescentar uma entrada no mapa**,
não editar um `if/else` no meio de um componente de 250 linhas:

```tsx
const KEY_EDITORS = {
  source: ({ key, value, onChange }) => <SourceEditor ... />,
  fields: (...) => <FieldsEditor ... />,
  // nova prop especial entra aqui, sem tocar no PropEditor
};
```

O componente que consome o despacho permanece **fechado para modificação** e
**aberto para extensão**.

### 4. Menos duplicação, uma fonte de verdade

Campos repetidos viram dados:

```tsx
const STRING_SECTIONS = [
  { title: "Identificacao", fields: [{ key: "name", required: true }, ...] },
  { title: "Texto/Hint", fields: [...] },
];
```

Um campo novo é uma linha na config — não um bloco de JSX copiado e colado, com o
risco de esquecer o `onChange` ou o cast de valor.

### 5. Testabilidade isolada

Funções puras de despacho (`renderSpecificEditor`) e sub-componentes podem ser
testados sozinhos, com entradas controladas, sem montar a árvore inteira do
editor. Falhas ficam localizadas e os testes ficam mais rápidos e específicos.

### 6. Reaproveitamento

Peças genéricas (ex.: `SectionTitle`) deixam de ser markup repetido e passam a
ser reutilizadas. Se o estilo do título mudar, muda em um lugar só.

### 7. Diffs e revisão de código mais limpos

Mudanças ficam confinadas ao módulo relevante. O revisor vê "alterou o
`WrapperSection`" em vez de um diff gigante no meio de um componente monolítico,
o que torna a revisão mais segura e rápida.

### 8. Menor carga cognitiva e menos conflitos de merge

Arquivos/funções menores cabem na cabeça de uma vez e reduzem a chance de duas
pessoas editarem exatamente as mesmas linhas.

## Quando vale a pena (e quando não)

Modularizar é um investimento; aplique quando houver retorno:

| Vale a pena | Pense duas vezes |
|---|---|
| JSX repetido ≥ 3 vezes com a mesma forma | Bloco único, usado uma vez só |
| Lógica de seleção/despacho com vários ramos | 1 ou 2 ramos triviais |
| Seções visuais com responsabilidades distintas | Componente já pequeno e coeso |
| Dados que crescem (listas de campos, tipos) | Estrutura fixa que nunca muda |

Sinais de que **passou do ponto**:

- abstração com mais flags/configuração do que o JSX direto teria;
- precisar pular entre muitos arquivos para entender um fluxo simples;
- config tão específica que serve a um único caso (era melhor inline).

> Regra prática: extraia quando a duplicação ou a complexidade **já doem**, não
> de forma especulativa. Comece inline; modularize quando o padrão se repetir.

## Padrões usados no caso de referência

| Padrão | Onde | Para quê |
|---|---|---|
| Decomposição em sub-componentes | `EditorHeader`, `*Section` | isolar seções e seus estilos |
| Componente utilitário reaproveitado | `SectionTitle` | eliminar markup repetido |
| Mapa de despacho (registry) | `KEY_EDITORS` / `KIND_EDITORS` | trocar `if/else` por lookup extensível |
| Config declarativa + `map` | `STRING_SECTIONS` | descrever a UI como dados |
| Props tipadas reaproveitadas | `ChangeProp`, `ChangeMeta` | evitar repetir assinaturas |

## Resumo

Separar por módulos troca **um arquivo grande difícil de mudar** por **peças
pequenas fáceis de entender, testar e estender**. O ganho principal não é
estético: é reduzir o custo de cada mudança futura e o risco de quebrar o que já
funciona. Faça isso guiado pela dor real (repetição, ramificação, seções
distintas), não por dogma.