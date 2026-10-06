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

Antes de commitar, mostre ao usuário a justificativa e o risco que vão no body e espere a confirmação. O hook `git-guard` só libera a main quando `/git:main` está no prompt digitado e o body traz `Main-Justification:` e `Main-Risk:`. Cada commit liberado fica em `~/.claude/git-main-audit.log`.
