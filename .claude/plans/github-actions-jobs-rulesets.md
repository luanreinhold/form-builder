# GitHub Actions, Jobs e Rulesets — Guia do Projeto

> Guia explicativo usando o arquivo real deste projeto, [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), como exemplo.

---

## 1. O que é o GitHub Actions

GitHub Actions é o sistema de automação do GitHub. Ele executa **workflows** (fluxos de trabalho) em resposta a eventos do repositório — um push, a abertura de um PR, um agendamento, etc. O caso de uso mais comum é **CI (Integração Contínua)**: rodar os testes automaticamente a cada alteração no código.

Todo workflow é um arquivo YAML dentro de `.github/workflows/`. O GitHub detecta os arquivos dessa pasta automaticamente — não há nada para "ativar" na interface.

## 2. Anatomia do nosso workflow

Arquivo atual do projeto:

```yaml
name: Continuous Integration Testing

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 24.x
        cache: 'pnpm'
    - name: Instalando dependências
      run: pnpm install --frozen-lockfile
    - name: Executando esteira de testes
      run: pnpm test
```

### `name`
Nome de exibição do workflow na aba **Actions** do GitHub. Puramente cosmético.

### `on` — os gatilhos
Define **quando** o workflow roda. No nosso caso:

- `push` na branch `main` → roda após o push chegar ao GitHub.
- `pull_request` com alvo na `main` → roda a cada commit enviado a um PR aberto contra a `main`.

Ponto importante: **o workflow roda depois que o código já chegou ao GitHub**. O CI nunca "desfaz" um push — ele apenas sinaliza sucesso ou falha. Quem bloqueia alguma coisa com base nesse sinal é o ruleset (seção 5).

### `jobs` — as unidades de trabalho
Um workflow contém um ou mais **jobs**. Cada job:

- Roda em uma **máquina virtual nova e isolada** (`runs-on: ubuntu-latest` = Ubuntu mais recente).
- Roda **em paralelo** com outros jobs, a menos que se declare dependência com `needs:`.
- Gera um **status check** com o nome do job (ver seção 4).

Nosso workflow tem um único job, `build`.

### `steps` — os passos do job
Executados **em sequência** dentro da mesma máquina. Se um passo falha, os seguintes não rodam e o job inteiro falha. Dois tipos:

| Tipo | O que faz | Exemplo no nosso arquivo |
|---|---|---|
| `uses:` | Reutiliza uma **action** pronta do marketplace | `actions/checkout@v4` (baixa o código), `pnpm/action-setup@v4` (instala o pnpm), `actions/setup-node@v4` (instala o Node 24 e cacheia o store do pnpm) |
| `run:` | Executa um comando de shell | `pnpm install --frozen-lockfile`, `pnpm test` |

Detalhes do nosso pipeline:

- `--frozen-lockfile` garante que o CI instale exatamente o que está no `pnpm-lock.yaml` — se o lockfile estiver dessincronizado do `package.json`, o job falha em vez de instalar versões diferentes silenciosamente.
- `pnpm test` executa `vitest run` (modo single-run, sem watch). Se qualquer teste falhar, o Vitest sai com código de erro ≠ 0, o passo falha e o job `build` fica vermelho.

## 3. Matriz (`strategy.matrix`) — o que tínhamos antes

A versão anterior do arquivo usava:

```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x]
```

Isso multiplica o job: o GitHub cria **uma execução por valor da matriz** — `build (20.x)` e `build (22.x)` —, cada uma em sua própria VM.

**Quando usar matriz:** bibliotecas publicadas no npm, que precisam funcionar em várias versões de Node que os consumidores possam ter.

**Por que removemos:** este projeto é uma aplicação (o código final roda no navegador; o Node é só ferramenta de build/teste). Nós controlamos a versão de Node do ambiente, então a matriz só dobrava o tempo de CI e o consumo de minutos. Além disso, os nomes dinâmicos (`build (20.x)`) complicam a configuração de checks obrigatórios — se a matriz muda, o nome do check muda e a regra quebra.

> Se um dia a matriz voltar, o padrão recomendado é adicionar um job "gate" de nome fixo (ex.: `ci-ok`) com `needs: build` e `if: always()`, e marcar **ele** como check obrigatório em vez dos nomes da matriz.

## 4. Status checks — o elo entre Actions e Rulesets

**Ninguém cria checks manualmente.** Cada job de workflow, ao rodar, registra automaticamente um *status check* no commit, com o nome do job:

- Job `build` sem matriz → check **`build`**
- Job `build` com matriz → checks **`build (20.x)`**, **`build (22.x)`**

É o ✓ verde ou ✗ vermelho que aparece ao lado dos commits e dentro dos PRs.

Dois comportamentos que confundem:

1. **A busca de checks na tela de proteção de branch começa vazia** — é preciso digitar o nome. Ela só lista checks que rodaram no repositório nos últimos ~7 dias.
2. **Checks antigos continuam aparecendo por ~7 dias** após deixarem de existir (foi o que aconteceu aqui: `build (20.x)` e `build (22.x)` seguiram na lista depois da remoção da matriz). Marcá-los como obrigatórios travaria os PRs para sempre, pois nunca mais vão rodar.

## 5. Rulesets (proteção de branch)

Um **ruleset** é uma regra configurada em **Settings → Rules → Rulesets** (ou o formato antigo, *classic branch protection rule*, em Settings → Branches). Ele transforma o status check de "informativo" em "obrigatório":

| Configuração | Efeito |
|---|---|
| **Require status checks to pass** + selecionar `build` | PR com testes falhando fica com o botão de merge **bloqueado** |
| **Require a pull request before merging** | Push direto na branch protegida é **rejeitado** — todo código entra via PR |
| **Require branches to be up to date** (opcional) | Exige que o PR esteja rebaseado/atualizado com a `main` antes do merge, garantindo que os testes rodaram contra o código atual |

### O fluxo completo, na ordem correta

1. O job existe no `ci.yml` e **roda pelo menos uma vez** (push qualquer serve) → o check `build` passa a existir.
2. Criar o ruleset na `main` apontando para o check `build`.
3. A partir daí: PR aberto → CI roda → testes falham → check vermelho → merge travado. Testes passam → merge liberado.

### ⚠️ Limitação do plano Free (situação atual deste repo)

Em **repositório privado no plano GitHub Free, rulesets e branch protection NÃO são aplicados** — dá para configurar tudo, mas o GitHub não bloqueia nada de verdade (aviso: *"Your rulesets won't be enforced on this private repository"*).

Opções:

| Opção | Custo | Bloqueia merge de PR | Bloqueia push direto |
|---|---|---|---|
| Tornar o repo **público** | Grátis | ✅ | ✅ |
| Hook **`pre-push` local** (husky rodando `pnpm test`) | Grátis | ❌ (mas o ✗ fica visível no PR) | ✅ (aborta o push na máquina, antes de sair) |
| **GitHub Pro** (~US$ 4/mês) | Pago | ✅ | ✅ |

## 6. Limites do GitHub Actions

- **Repo público:** runners padrão são gratuitos e **ilimitados**.
- **Repo privado (Free):** **2.000 minutos/mês** + 500 MB de storage para artifacts. Linux conta 1x (Windows 2x, macOS 10x). Nosso job em `ubuntu-latest` leva ~1–2 min por execução → margem para centenas de execuções mensais.
- Estourou a cota? Workflows param até o mês virar; sem cobrança surpresa (limite de gasto padrão é US$ 0).
- Consumo visível em **Settings da conta → Billing and plans → Usage**.

## 7. Referência rápida

```text
.github/workflows/ci.yml   ← definição do workflow (versionada com o código)
Aba Actions                ← histórico de execuções e logs
Settings → Rules           ← rulesets (proteção de branch)
name do job                ← vira o nome do status check
on: push / pull_request    ← gatilhos
needs:                     ← dependência entre jobs (senão rodam em paralelo)
if: always()               ← roda o job mesmo se a dependência falhou
```