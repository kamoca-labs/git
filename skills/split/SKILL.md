---
name: split
description: Quebra uma branch grande em branches menores e encadeadas, uma por assunto, cada uma pronta para um PR/MR pequeno. A branch original fica intacta.
argument-hint: "[branch] [/<plugin>:<comando> ...]"
---

# git:split

A branch original **nunca** é alterada nem apagada: ela é o backup. Tudo sai em branches novas.

## Passos

1. Working tree limpo (`git status`). Se não estiver, pare e peça para commitar ou fazer stash.
2. Descubra a base: `git fetch origin` e `git merge-base origin/<branch-padrão> <branch>`. A branch padrão vem de `git symbolic-ref --short refs/remotes/origin/HEAD`.
3. Leia o que a branch muda: `git log --reverse --format='%h %s' <base>..<branch>` e `git diff --stat <base>...<branch>`.
4. Proponha as partes, em ordem de dependência (o que é base vem primeiro):
   - cada parte com um assunto só, revisável sozinha, de preferência abaixo de ~400 linhas;
   - refactor e renomeação antes da feature que depende deles;
   - testes junto com o código que testam.
   Mostre a lista (`<n>. <tipo>/<assunto-kebab>`: commits ou arquivos de cada uma) e espere a confirmação.
5. Monte cada parte a partir da anterior (a primeira sai da base):
   ```bash
   git switch -c <tipo>/<assunto>-<n> <parte-anterior|base>
   ```
   - commits já atômicos: `git cherry-pick <hash>...`;
   - commit misturando assuntos: `git checkout <branch> -- <arquivos>` e commite pela skill `git:commit` (Skill tool).
   Arquivo que entra em mais de uma parte: aplique só os hunks da parte com `git diff <base> <branch> -- <arquivo>` num arquivo temporário (`mktemp`), edite o patch e `git apply`.
6. Confira que a última parte reproduz a original: `git diff <última-parte> <branch>` tem que sair vazio. Se não sair, mostre o que falta e corrija antes de seguir.
7. `git push -u origin <parte>` para cada uma.
8. Com um comando nos argumentos (`/git:mr`, por exemplo), invoque essa skill (Skill tool) para cada parte, na ordem, com `target:<parte-anterior>`. A primeira parte mira a branch padrão. Peça para citar o PR/MR anterior em "Referências".
9. Devolva a cadeia (`parte 1 ← parte 2 ← ...`) e lembre que o merge vai na ordem: depois do merge da parte 1, GitHub e GitLab redirecionam a parte 2 para a branch padrão sozinhos se a branch da 1 for removida.
