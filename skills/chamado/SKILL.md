---
name: chamado
description: Amarra o trabalho a um número de chamado. Combinado com /git:commit ou /gitlab:mr, o número vira o escopo semântico (feat(19738): ...). Sozinho, cria a branch do chamado a partir da main atualizada.
argument-hint: "<numero> [/git:commit|/gitlab:mr] [descrição]"
---

# git:chamado

O primeiro argumento é o número do chamado. O hook `ticket-scope` exige que o escopo seja esse número sempre que `/git:chamado <n>` estiver no prompt.

- **Com `/git:commit` nos argumentos**: invoque a skill `git:commit` (Skill tool) usando `<n>` como escopo de todos os commits.
- **Com `/gitlab:mr` nos argumentos**: invoque a skill `gitlab:mr` (Skill tool) com `<n>` como escopo do título e cite o chamado em "Referências".
- **Sozinho**:
  1. com o working tree limpo, `git fetch origin` e `git switch -c <tipo>/<n>-<assunto-kebab> origin/<branch-padrão>`;
  2. o tipo e o assunto vêm da descrição. Se ela não vier, pergunte.
