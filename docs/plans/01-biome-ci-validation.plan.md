# Plano: Validação do Biome no CI/CD

**Fonte**: requisito do usuário (texto livre)
**Funcionalidade**: 1 de 2 — Biome como gate no pipeline
**Complexidade**: Small

## Resumo

Adicionar o Biome como etapa obrigatória no workflow de CI já existente
([.github/workflows/ci.yml](../../.github/workflows/ci.yml)), de forma que qualquer push/PR
para `main` falhe se houver código fora do padrão de formatação, lint ou organização de
imports. Essa é a **rede de segurança definitiva** da padronização — independe de editor
(VS Code, WebStorm, etc.) e de qualquer hook local. O Biome já é devDependency
([package.json:28](../../package.json#L28)), então não há nova instalação no runner.

## Padrões a espelhar

| Categoria | Fonte | Padrão |
|---|---|---|
| Scripts | [package.json:7-15](../../package.json#L7-L15) | nomes curtos, verbos diretos |
| CI steps | [.github/workflows/ci.yml:21-24](../../.github/workflows/ci.yml#L21-L24) | nomes de step em PT-BR, `pnpm install --frozen-lockfile` |
| Config Biome | [biome.json](../../biome.json) | escopo `**/*.{ts,tsx,json}`, ignora `legacy-core` |

## Por que `biome ci` (e não `biome check`)

- `biome ci` é o modo desenhado para pipelines: **não escreve** arquivos, trata avisos/erros
  como falha e usa saída adequada para CI. É read-only por natureza — não há risco de
  "auto-fix" mascarar problema.
- `biome check --write` ficaria reservado ao uso local / hook (funcionalidade 2).

## Arquivos a alterar

| Arquivo | Ação | Porquê |
|---|---|---|
| `package.json` | UPDATE | adicionar scripts `check` e `ci` para uso local e no pipeline |
| `.github/workflows/ci.yml` | UPDATE | inserir step de Biome antes (ou em paralelo a) os testes |

## Tarefas

### Tarefa 1: Adicionar scripts de Biome no package.json
- **Ação**: incluir no bloco `scripts`:
  ```json
  "check": "biome check",
  "check:fix": "biome check --write",
  "ci": "biome ci"
  ```
- **Espelhar**: estilo de scripts existentes em [package.json:7-15](../../package.json#L7-L15).
- **Validar**: `pnpm check` roda localmente sem erro de configuração.

### Tarefa 2: Adicionar step de Biome no workflow
- **Ação**: em [.github/workflows/ci.yml](../../.github/workflows/ci.yml), após
  "Instalando dependências" e antes de "Executando esteira de testes", inserir:
  ```yaml
    - name: Validando formatação e lint (Biome)
      run: pnpm ci
  ```
  > Observação: o script chama-se `ci` para casar com `biome ci`; se houver conflito
  > de leitura com o conceito de CI, usar `pnpm check:ci` renomeando o script para
  > `"check:ci": "biome ci"`. Decidir o nome na revisão.
- **Espelhar**: formato e idioma dos steps em [ci.yml:21-24](../../.github/workflows/ci.yml#L21-L24).
- **Validar**: abrir PR de teste e confirmar que o job falha quando há diff de formatação
  e passa quando o código está formatado.

### Tarefa 3 (opcional): Ordem e falha rápida
- **Ação**: avaliar colocar o step do Biome **antes** dos testes para "fail fast" —
  feedback de estilo é mais barato que a suíte de testes.
- **Validar**: tempo total do job não regride de forma relevante.

## Validação

```bash
# local, simulando o que o CI roda
pnpm install --frozen-lockfile
pnpm ci          # ou pnpm check:ci — deve falhar se houver diff/lint
```

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Base atual tem arquivos fora do padrão → CI vermelho de imediato | Média | rodar `pnpm check:fix` e commitar a formatação antes de ativar o gate |
| Versão do Biome no CI divergir da local | Baixa | versão fixa `2.4.16` em devDependencies + `--frozen-lockfile` garante paridade |
| Pasta `legacy-core` entrar na checagem | Baixa | já está ignorada em [biome.json:14-15](../../biome.json#L14-L15) |
| Nome de script `ci` confundir com conceito de pipeline | Baixa | renomear para `check:ci` (ver Tarefa 2) |

## Aceitação

- [ ] Scripts `check`/`ci` (ou `check:ci`) presentes no package.json
- [ ] Step de Biome no ci.yml rodando em push e pull_request para `main`
- [ ] PR com código mal formatado é bloqueado pelo CI
- [ ] Base existente passa no `pnpm check` (formatação já regularizada)
- [ ] Sem nova dependência adicionada (Biome já é devDep)