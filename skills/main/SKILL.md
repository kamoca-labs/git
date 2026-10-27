---
name: main
description: Authorizes a direct commit and push to main, explicitly and with an audit record. It works only together with /git:commit and needs a justification and the risks in the body.
argument-hint: "/git:commit [instructions]"
disable-model-invocation: true
---

# git:main

This skill only authorizes. The `/git:commit` skill does the work.

- **With `/git:commit` in the arguments**: invoke the `git:commit` skill (Skill tool), section "Commit on main".
- **Alone**: do nothing. Explain that the usage is `/git:commit /git:main` or `/git:main /git:commit`.

`/git:main` in the prompt is already the authorization. Write the justification and the risk in the body. Commit without a confirmation request. The `protected-branch-commit` and `protected-branch-push` hooks allow main only when `/git:main` is in the prompt the user typed and the body has `Main-Justification:` and `Main-Risk:`. The `main-audit` hook records each allowed commit in `~/.claude/git-main-audit.log`.
