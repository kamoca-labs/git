# Plugin `git`

## Sumário

- [Instalação](#instalação)
- [Visão geral](#visão-geral)
- [Comandos](#comandos)
- [Regras](#regras)
- [Commit na main](#commit-na-main)
- [Arquivos](#arquivos)
- [Casos de uso](USAGE.md)

## Instalação

```bash
claude plugin marketplace add ~/Development/claude-plugins
claude plugin install git@kamoca
```

Requer Node 22.18+. Os comandos aparecem na próxima sessão. Clone e atualização estão no [README do repo](../../README.md#instalação).

## Visão geral

Commits semânticos, atômicos e explicados, sempre em branch dedicada. Cada regra é um hook próprio que nega o commit ou o push fora do padrão. As mensagens chegam com o nome da regra: `[git:<regra>] motivo`.

## Comandos

| Comando | Argumentos | O que faz |
|---|---|---|
| `/git:commit` | `[/git:main] [/<plugin>:<comando> ...] [instruções]` | Lê o diff e a conversa, agrupa por assunto, commita com body e faz push. Na main sem `/git:main`, cria uma branch antes. Comando de outro plugin nos argumentos roda depois do push |
| `/git:main` | `/git:commit [...]` | Só autoriza. O Claude não consegue invocá-lo sozinho (`disable-model-invocation`) |
| `/git:sync` | `[branch]` | Mergeada: volta para a branch padrão atualizada e apaga a local com `-d`. Não mergeada: fica nela e faz `pull`. Limpa outras branches já mergeadas |
| `/git:split` | `[branch] [/<plugin>:<comando> ...]` | Quebra a branch em branches encadeadas, uma por assunto, conferindo que a soma reproduz a original. A original fica intacta |
| `/git:undo` | `[commit\|amend\|rebase\|merge\|reset\|branch <nome>]` | Desfaz pelo reflog, com branch de backup antes; em branch compartilhada usa `revert` |

## Regras

Disparam em `git commit` e `git push` feitos pelo Claude. O `git` digitado por você no terminal não passa por elas.

| Regra (`hooks/rules/`) | Evento | Limite | Exemplo negado |
|---|---|---|---|
| `commit-message-readable` | commit | mensagem em `-m`, `-F <arquivo>` ou heredoc; `--no-edit` passa | `git commit` abrindo editor |
| `semantic-title` | commit | `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `ci`, `build`, `revert` | `add endpoint` |
| `title-length` | commit | até 72 chars | título com 80 chars |
| `single-item-commit` | commit | sem `e`, `and`, `&` ou `+` no título (literal entre crases não conta) | `feat: add endpoint and fix login` |
| `commit-body` | commit | body de 30 a 1000 chars, linhas de até 100 | só o título |
| `no-co-author` | commit | sem `Co-Authored-By` nem "Generated with Claude" | trailer de co-author |
| `protected-branch-commit` | commit | na `main`/`master`, só com `/git:main` e os trailers | commit na main sem autorização |
| `protected-branch-push` | push | push para `main`/`master` só com `/git:main`; push só de tag (`refs/tags/...`) passa | `git push origin HEAD:main` |
| `main-audit` | depois do commit | registra cada commit feito na main | (não nega) |

## Commit na main

Exige `/git:main` no **seu** prompt e dois trailers no body:

```
Main-Justification: por que não dá para passar por branch e PR/MR
Main-Risk: o que pode quebrar e como reverter
```

Cada commit liberado vira uma linha em `~/.claude/git-main-audit.log` (data, repo, hash, título). Os trailers também ficam no histórico do git:

```bash
git log --grep 'Main-Risk:'
```

## Arquivos

| Caminho | Papel |
|---|---|
| `skills/commit/SKILL.md` | passos e formato do commit |
| `skills/main/SKILL.md` | autorização da main |
| `skills/sync/SKILL.md` | volta para a padrão depois do merge e limpa as branches |
| `skills/split/SKILL.md` | divisão da branch em partes encadeadas |
| `skills/undo/SKILL.md` | recuperação pelo reflog, caso a caso |
| `hooks/hooks.json` | um hook por regra, com `if:` e `statusMessage` próprios |
| `hooks/lib.ts` | leitura do payload, extração da mensagem, leitura do prompt (`/git:main`) |
| `hooks/rules/<regra>.ts` | uma regra por arquivo |
| `hooks/tests/<regra>.test.ts` | os casos de cada regra, isolada |
| `hooks/tests/cases.json` | casos de uso de ponta a ponta: cada um passa por **todos** os hooks e declara quais regras negam |
| `hooks/tests/cases.test.ts` | roda o `cases.json` contra o `hooks.json` |
| `hooks/tests/capture.test.ts` | garante que negação real vira caso em `~/.claude/hook-cases.jsonl` |
| `hooks/tests/structure.test.ts` | garante que toda regra tem hook dedicado e teste próprio |

Rodar: `node --test 'hooks/tests/*.test.ts'`. Como transformar um caso real em teste está no [USAGE do repo](../../USAGE.md#transformar-caso-real-em-teste).
