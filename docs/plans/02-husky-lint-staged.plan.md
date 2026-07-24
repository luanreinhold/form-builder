# Plano: Husky + lint-staged (hook pre-commit com Biome)

**Fonte**: requisito do usuário (texto livre)
**Funcionalidade**: 2 de 2 — gate local antes do commit
**Complexidade**: Small/Medium

## Resumo

Configurar um hook `pre-commit` via **Husky** que executa **lint-staged**, rodando o Biome
apenas nos arquivos staged (`biome check --write`). Isso dá feedback rápido e local em
**qualquer editor** (VS Code, WebStorm, terminal puro), formatando e aplicando safe-fixes
antes do commit entrar. É a camada de conveniência; a imposição definitiva continua sendo o
CI (funcionalidade 1). Projeto usa `pnpm@10.23.0` ([package.json:6](../../package.json#L6))
e Biome `2.4.16` ([package.json:28](../../package.json#L28)).

## Padrões a espelhar

| Categoria | Fonte | Padrão |
|---|---|---|
| Gerenciador | [package.json:6](../../package.json#L6) | sempre `pnpm`, nunca npm/npx/yarn |
| Scripts | [package.json:7-15](../../package.json#L7-L15) | bloco `scripts` enxuto |
| Escopo Biome | [biome.json:10-16](../../biome.json#L10-L16) | `**/*.{ts,tsx,json}`, ignora `populis-v3-core` |

## Decisões de design

- **Husky v9+**: API atual usa `husky init` e arquivos de hook simples em `.husky/`
  (sem o boilerplate antigo de `husky.sh`).
- **Script `prepare`**: `"prepare": "husky"` garante que o hook seja instalado
  automaticamente após `pnpm install` em qualquer máquina do time.
- **lint-staged + Biome**: comando recomendado para staged files:
  `biome check --write --no-errors-on-unmatched`. O `--write` aplica formatação e
  safe-fixes; o lint-staged re-adiciona ao stage os arquivos modificados automaticamente.
- **`--no-errors-on-unmatched`**: evita erro quando o conjunto staged não casa com nenhum
  arquivo suportado pelo Biome.

## Arquivos a alterar / criar

| Arquivo | Ação | Porquê |
|---|---|---|
| `package.json` | UPDATE | devDeps `husky` + `lint-staged`, script `prepare`, bloco `lint-staged` |
| `.husky/pre-commit` | CREATE | hook que chama `pnpm exec lint-staged` |
| `.gitignore` | VERIFICAR | garantir que `.husky/` **não** seja ignorado (precisa ser versionado) |

## Tarefas

### Tarefa 1: Instalar dependências
- **Ação**: `pnpm add -D husky lint-staged`
- **Mirror**: pnpm como gerenciador ([package.json:6](../../package.json#L6)).
- **Validar**: `husky` e `lint-staged` aparecem em `devDependencies`.

### Tarefa 2: Inicializar Husky
- **Ação**: `pnpm exec husky init` — cria `.husky/pre-commit` e adiciona
  `"prepare": "husky"` ao package.json.
- **Validar**: pasta `.husky/` existe; script `prepare` presente.

### Tarefa 3: Configurar o hook pre-commit
- **Ação**: substituir o conteúdo de `.husky/pre-commit` por:
  ```sh
  pnpm exec lint-staged
  ```
- **Validar**: `git commit` dispara o lint-staged.

### Tarefa 4: Configurar o lint-staged
- **Ação**: adicionar ao package.json:
  ```json
  "lint-staged": {
    "*.{ts,tsx,json,jsonc}": [
      "biome check --write --no-errors-on-unmatched"
    ]
  }
  ```
- **Mirror**: mesmas extensões de [biome.json:10-16](../../biome.json#L10-L16).
- **Validar**: editar um arquivo mal formatado, `git add`, `git commit` → arquivo é
  formatado e o commit prossegue já corrigido.

### Tarefa 5: Garantir versionamento do .husky
- **Ação**: conferir que `.gitignore` não bloqueia `.husky/`; commitar a pasta.
- **Validar**: `git status` mostra `.husky/pre-commit` como rastreado.

## Validação

```bash
# fluxo end-to-end
pnpm install                 # 'prepare' instala o hook
echo "const x=1"  >> src/teste-fmt.ts   # arquivo deliberadamente fora do padrão
git add src/teste-fmt.ts
git commit -m "test: hook"   # lint-staged deve formatar antes de finalizar
git show --stat HEAD         # confirma que o arquivo entrou já formatado
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Hook não roda em quem clonou antes do setup | Média | `prepare: husky` instala no próximo `pnpm install`; documentar no README |
| Windows: hook depende de shell | Baixa | Husky usa o Git Bash do Git for Windows; ambiente do projeto já tem Bash |
| Dev burlar com `git commit --no-verify` | Média | aceitável — o **CI** (funcionalidade 1) é o gate que não pode ser burlado |
| `--write` reescrever e não re-stagear | Baixa | lint-staged re-adiciona automaticamente os arquivos que modificou |
| Conflito Husky v9 vs configs antigas | Baixa | projeto não tem `.husky` prévio — instalação limpa |

## Dependências

- Funciona de forma independente, mas é **complementar** à funcionalidade 1
  ([01-biome-ci-validation.plan.md](01-biome-ci-validation.plan.md)): hook = conveniência
  local; CI = imposição. Recomenda-se implementar o CI primeiro para ter a garantia real
  antes de otimizar o fluxo local.

## Aceitação

- [ ] `husky` e `lint-staged` em devDependencies
- [ ] Script `prepare: husky` no package.json
- [ ] `.husky/pre-commit` versionado, chamando `pnpm exec lint-staged`
- [ ] Bloco `lint-staged` rodando Biome só nos arquivos staged
- [ ] Commit de arquivo mal formatado resulta em arquivo formatado automaticamente
- [ ] README documenta o setup para novos clones (opcional, recomendado)