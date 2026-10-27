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
claude plugin marketplace add kamoca-labs/marketplace
claude plugin install git@kamoca
```

Requer Node 22.18+. Os comandos aparecem na próxima sessão. Atualização está no [README do marketplace](https://github.com/kamoca-labs/marketplace#instalação).

## Visão geral

Commits semânticos, atômicos e explicados, sempre em branch dedicada, e PR/MR com descrição curta, sem squash e sem menção a IA. Cada regra é um hook próprio que nega o commit, o push ou o PR/MR fora do padrão. As mensagens chegam com o nome da regra: `[git:<regra>] motivo`.

## Comandos

| Comando | Argumentos | O que faz |
|---|---|---|
| `/git:commit` | `[/git:main] [/<plugin>:<comando> ...] [instruções]` | Lê o diff e a conversa, agrupa por assunto, commita com body e faz push. Na main sem `/git:main`, cria uma branch antes. Comando de outro plugin nos argumentos roda depois do push |
| `/git:mr` | `[@revisor ...\|@auto] [draft] [target:<branch>] [instruções]` | Abre o PR/MR no GitHub ou no GitLab pelo MCP da forja, ou pela CLI (`gh`, `glab`) quando não há MCP. Título semântico, descrição com **Por quê** e **O que muda**, revisores informados ou sugeridos pelo histórico (`@auto`), draft e destino. Se a branch já tem PR/MR, atualiza esse PR/MR |
| `/git:review` | `[<link\|número do PR/MR>] [approve] [contexto]` | Revisa o PR/MR de outra pessoa a partir do link, do número ou da sua fila de revisão. Mostra os achados para confirmação e publica num único review, com comentários em linha |
| `/git:ci` | `[<link\|número do PR/MR\|id do pipeline>] [retry] [contexto]` | Diagnostica o GitHub Actions ou o GitLab CI: lê o log dos jobs que falharam, aponta a causa e propõe a correção. Com `retry`, roda de novo só as falhas intermitentes |
| `/git:daily` | `[since:yesterday\|AAAA-MM-DD] [pasta dos repos]` | Junta os commits de todos os repos locais e os PR/MR do GitHub e do GitLab desde o último dia útil, e escreve a daily (ontem, hoje, bloqueios) |
| `/git:release` | `[major\|minor\|patch\|vX.Y.Z] [rc]` | Calcula a versão pelos commits semânticos, escreve o changelog, cria a tag anotada e a release na forja. O Claude não consegue invocá-lo sozinho |
| `/git:main` | `/git:commit [...]` | Só autoriza. O Claude não consegue invocá-lo sozinho (`disable-model-invocation`) |
| `/git:sync` | `[branch]` | Mergeada: volta para a branch padrão atualizada e apaga a local com `-d`. Não mergeada: fica nela e faz `pull`. Limpa outras branches já mergeadas |
| `/git:split` | `[branch] [/<plugin>:<comando> ...]` | Quebra a branch em branches encadeadas, uma por assunto, conferindo que a soma reproduz a original. A original fica intacta |
| `/git:undo` | `[commit\|amend\|rebase\|merge\|reset\|branch <nome>]` | Desfaz pelo reflog, com branch de backup antes; em branch compartilhada usa `revert` |

Os comandos que falam com a forja carregam a sub-skill `git:forge`. Ela acha a forja e o projeto pelo link ou pelo `origin`, e escolhe a ferramenta para cada operação: o MCP da forja quando existe, a CLI (`gh`, `glab`) quando não existe, ou o pedido ao usuário para autenticar.

## Regras

Disparam em `git commit`, `git push` e na escrita de PR/MR feitos pelo Claude, pela CLI (`gh pr`, `glab mr`) ou pelo MCP do GitHub e do GitLab. O `git` digitado por você no terminal não passa por elas.

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
| `mr-no-ai` | PR/MR | título e descrição sem `Co-Authored-By`, "Generated with", 🤖, link de sessão nem nome de IA (Claude, Anthropic, OpenAI, ChatGPT, GPT, Copilot, Gemini, Codex, DeepSeek); arquivo entre crases (`CLAUDE.md`) passa. Vale em `gh pr create\|edit\|comment\|review` e `glab mr create\|update\|note` | `Generated with [Claude Code]` no fim da descrição |
| `mr-semantic-title` | PR/MR | título no padrão semântico; o prefixo `Draft: ` não conta | `atualiza upload` |
| `mr-title-length` | PR/MR | até 72 chars, sem contar `Draft: ` | título com 80 chars |
| `mr-description` | PR/MR | descrição de 80 a 3000 chars, obrigatória na criação | PR/MR sem descrição |
| `mr-sections` | PR/MR | descrição com `## Por quê` e `## O que muda` | descrição sem seção |
| `mr-no-squash` | PR/MR e merge | sem squash; no MCP do GitLab, a criação exige `squash: false` explícito | `gh pr merge --squash` |
| `no-api-commit` | MCP | nega commit pela API da forja (`add_commit`, `create_or_update_file`, `push_files`, `delete_file`) | arquivo editado direto pelo MCP do GitHub |
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
| `skills/mr/SKILL.md` | passos, formato e comandos do PR/MR |
| `skills/forge/SKILL.md` | forja, projeto e ferramenta (MCP, CLI ou pedido ao usuário), compartilhados pelos comandos da forja |
| `skills/review/SKILL.md` | revisão de PR/MR com confirmação antes de publicar |
| `skills/ci/SKILL.md` | diagnóstico do CI e retry das falhas intermitentes |
| `skills/daily/SKILL.md` | coleta de commits e PR/MR e texto da daily |
| `skills/release/SKILL.md` | versão, changelog, tag e release |
| `skills/sync/SKILL.md` | volta para a padrão depois do merge e limpa as branches |
| `skills/split/SKILL.md` | divisão da branch em partes encadeadas |
| `skills/undo/SKILL.md` | recuperação pelo reflog, caso a caso |
| `hooks/hooks.json` | um hook por regra, com `if:` e `statusMessage` próprios |
| `hooks/lib.ts` | leitura do payload, extração da mensagem do commit e do PR/MR (CLI e MCP), leitura do prompt (`/git:main`) |
| `hooks/rules/<regra>.ts` | uma regra por arquivo |
| `hooks/tests/<regra>.test.ts` | os casos de cada regra, isolada |
| `hooks/tests/cases.json` | casos de uso de ponta a ponta: cada um passa por **todos** os hooks e declara quais regras negam |
| `hooks/tests/cases.test.ts` | roda o `cases.json` contra o `hooks.json` |
| `hooks/tests/capture.test.ts` | garante que negação real vira caso em `~/.claude/hook-cases.jsonl` |
| `hooks/tests/structure.test.ts` | garante que toda regra tem hook dedicado e teste próprio |

Rodar: `node --test 'hooks/tests/*.test.ts'`. Como transformar um caso real em teste está no [USAGE do repo](https://github.com/kamoca-labs/marketplace/blob/main/USAGE.md#transformar-caso-real-em-teste).
