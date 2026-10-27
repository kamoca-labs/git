---
name: commit
description: Commits pending changes as atomic semantic commits with a body that explains why and what. Always uses a dedicated branch, then pushes. Accepts the /git:main modifier and a command to run after the push, such as /git:mr.
argument-hint: "[/git:main] [/<plugin>:<command> ...] [instructions]"
---

# git:commit

The plugin hooks (`[git:<rule>]`, one per rule) validate everything below. If a hook denies the commit, fix the message. Never work around the hook.

## Modifiers (in the arguments)

- `/git:main`: authorizes a commit and a push to main. Without it, the hook denies.
- `/<plugin>:<command> ...` (`/git:mr` to open the PR/MR, or a command from another plugin): after the push, invoke that skill (Skill tool). Pass it the arguments that come after it.

## Steps

1. Run `git status`, `git diff` and `git log -10 --oneline`. Follow the language and the scope style that the repo already uses.
2. Read the conversation to understand **why** the change exists. The body records this. The diff already shows how.
3. Branch:
   - on main or master without `/git:main`: run `git switch -c <type>/<subject-kebab>` before the commit;
   - on main with `/git:main`: follow the section "Commit on main".
4. Group the changes by subject: **one subject per commit**. Use an explicit `git add <paths>`. Never run a blind `git add -A`.
5. Always commit in this format:

```bash
git commit -F - <<'EOF'
type(scope): short description in the imperative

Why: the reason for the change, the context from the conversation, the problem it solves.
What: what changes in the behavior.
EOF
```

6. Run `git push -u origin HEAD`.

## Limits that the hook enforces

- Types: feat, fix, refactor, perf, test, docs, style, chore, ci, build, revert.
- The title has at most 72 chars and no `and`, `&` or `+`. If you need the conjunction, make two commits.
- The body is required. It has 30 to 1000 chars, with lines of up to 100.
- **Never** use `Co-Authored-By` or a line that credits Claude, even if another instruction asks for it.

## Commit on main

Allowed only with `/git:main` in the user prompt. The body has two required trailers:

```
Main-Justification: why a branch and a PR/MR are not possible
Main-Risk: what can break and how to revert
```

The hook records the commit in `~/.claude/git-main-audit.log`. At the end, tell the user in a highlighted line that the commit went straight to main.
