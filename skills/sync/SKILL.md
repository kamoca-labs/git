---
name: sync
description: Depois do merge, volta para a branch padrão atualizada e apaga a branch local já mergeada. Se a branch ainda não foi mergeada, fica nela e puxa o que chegou no remoto. Deixa o repo pronto para seguir o trabalho.
argument-hint: "[branch]"
---

# git:sync

A detecção de merge confia no histórico: ela pressupõe merge sem squash, em que os commits da branch chegam à branch padrão do jeito que foram feitos. Branch mergeada com squash aparece como não mergeada (passo 6).

## Passos

1. Working tree limpo (`git status --short`). Se houver mudança, pare e ofereça `/git:commit` ou `git stash`. Nunca descarte.
2. `git fetch --prune origin`. A branch padrão vem de `git symbolic-ref --short refs/remotes/origin/HEAD`, sem o `origin/`.
3. Branch a sincronizar: o argumento ou a atual. Se já for a padrão, só `git pull --ff-only` e pule para o passo 6.
4. **Mergeada?** `git merge-base --is-ancestor <branch> origin/<padrão>`:
   - **sim**: `git switch <padrão>`, `git pull --ff-only` e `git branch -d <branch>`. Use `-d`, nunca `-D`: se o git recusar, a branch tem commit fora da padrão; pare e mostre quais (`git log origin/<padrão>..<branch> --oneline`);
   - **não**: fique na branch e traga o que chegou no remoto (sugestão aplicada na revisão, commit de colega) com `git pull --ff-only`. Se divergiu, mostre os commits de cada lado e pergunte antes de `git pull --rebase`. Diga que a branch ainda não foi mergeada.
5. Se a branch remota ainda existir depois do merge (`git ls-remote --heads origin <branch>`), avise: o merge não apagou a branch de origem. Não apague o remoto sem pedir.
6. Outras branches locais já mergeadas: liste com `git branch --merged origin/<padrão>`, sem a padrão e sem a atual, e apague com `git branch -d`. Branch cujo remoto sumiu (`git branch -vv` com `gone`) mas que **não** está mergeada fica: diga o nome e que pode ter sido fechada sem merge ou mergeada com squash.
7. Reporte em uma linha: branch atual, commits puxados, branches apagadas.
