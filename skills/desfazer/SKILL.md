---
name: desfazer
description: Desfaz com segurança o último commit, um amend, rebase, merge ou reset errado, ou recupera branch apagada, usando o reflog. Sempre cria uma branch de backup antes de mexer.
argument-hint: "[commit|amend|rebase|merge|reset|branch <nome>] [descrição do que deu errado]"
---

# git:desfazer

Nada se perde enquanto existir referência para o commit. Por isso: **backup primeiro, sempre**.

## Passos

1. Entenda o estado: `git status`, `git log -5 --oneline` e `git reflog -20 --date=relative`.
2. Identifique no reflog o ponto **antes** do erro (ex.: a linha anterior ao `rebase (start)`, ao `commit (amend)`, ao `reset: moving to`). Se o argumento não deixa claro o que desfazer, mostre as linhas do reflog e pergunte.
3. Crie o backup do estado atual: `git branch backup/desfazer-$(date +%Y%m%d-%H%M%S)`.
4. Se houver mudança não commitada e a operação for descartar o working tree, faça `git stash push -u -m desfazer` antes.
5. Aplique o caso:

| O que desfazer | Comando |
|---|---|
| último commit, mantendo as mudanças | `git reset --soft HEAD~1` |
| `commit --amend` | `git reset --soft HEAD@{1}` (volta ao commit de antes, com o amend no stage) |
| rebase, merge ou reset | `git reset --hard <hash do reflog do passo 2>` |
| branch apagada | `git branch <nome> <hash do reflog>` |
| arquivo apagado ou alterado | `git restore --source=<hash> -- <arquivo>` |

6. **Já foi pushado?** Confira com `git branch -r --contains <commit desfeito>`:
   - branch compartilhada (main, ou branch com MR que outra pessoa revisa): não reescreva. Use `git revert <hash>` e faça push normal;
   - branch só sua: depois do reset, `git push --force-with-lease`. **Pergunte antes**: isso reescreve o remoto.
7. Mostre o resultado (`git log -5 --oneline`, `git status`) e diga o nome da branch de backup. Ela pode ser apagada com `git branch -D <backup>` quando estiver tudo certo.

**Nunca** use `git push --force` puro, `git reflog expire` nem `git gc --prune`.
