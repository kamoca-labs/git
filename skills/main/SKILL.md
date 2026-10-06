---
name: main
description: Autoriza, de forma explícita e auditada, commit e push direto na main. Só vale combinado com /git:commit, exige justificativa e riscos no body.
argument-hint: "/git:commit [/git:chamado <n>] [instruções]"
disable-model-invocation: true
---

# git:main

Esta skill só autoriza. Quem executa é o `/git:commit`.

- **Com `/git:commit` nos argumentos**: invoque a skill `git:commit` (Skill tool), seção "Commit na main".
- **Sozinho**: não faça nada. Explique que o uso é `/git:commit /git:main` ou `/git:main /git:commit`.

`/git:main` no prompt já é a autorização: escreva a justificativa e o risco no body e commite sem pedir confirmação. Os hooks `protected-branch-commit` e `protected-branch-push` só liberam a main quando `/git:main` está no prompt digitado e o body traz `Main-Justification:` e `Main-Risk:`. O hook `main-audit` registra cada commit liberado em `~/.claude/git-main-audit.log`.
