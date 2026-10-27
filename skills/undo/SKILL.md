---
name: undo
description: Safely undoes the last commit, a wrong amend, rebase, merge or reset, or recovers a deleted branch, using the reflog. Always creates a backup branch before it changes anything.
argument-hint: "[commit|amend|rebase|merge|reset|branch <name>] [description of what went wrong]"
---

# git:undo

Nothing is lost while a reference to the commit exists. For this reason: **backup first, always**.

## Steps

1. Understand the state: `git status`, `git log -5 --oneline` and `git reflog -20 --date=relative`.
2. Find in the reflog the point **before** the error (for example, the line before `rebase (start)`, `commit (amend)` or `reset: moving to`). If the argument does not make clear what to undo, show the reflog lines and ask.
3. Create the backup of the current state: `git branch backup/undo-$(date +%Y%m%d-%H%M%S)`.
4. If there are uncommitted changes and the operation discards the working tree, run `git stash push -u -m undo` first.
5. Apply the case:

| What to undo | Command |
|---|---|
| the last commit, keeping the changes | `git reset --soft HEAD~1` |
| `commit --amend` | `git reset --soft HEAD@{1}` (goes back to the commit before, with the amend staged) |
| rebase, merge or reset | `git reset --hard <hash from the reflog in step 2>` |
| deleted branch | `git branch <name> <hash from the reflog>` |
| deleted or changed file | `git restore --source=<hash> -- <file>` |

6. **Already pushed?** Check with `git branch -r --contains <undone commit>`:
   - a shared branch (main, or a branch with a PR/MR that another person reviews): do not rewrite it. Use `git revert <hash>` and do a regular push;
   - a branch that only you use: after the reset, run `git push --force-with-lease`. **Ask first**: this rewrites the remote.
7. Show the result (`git log -5 --oneline`, `git status`) and give the name of the backup branch. The user can delete it with `git branch -D <backup>` when everything is fine.

**Never** use a plain `git push --force`, `git reflog expire` or `git gc --prune`.
