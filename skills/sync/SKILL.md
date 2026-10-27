---
name: sync
description: After the merge, goes back to the updated default branch and deletes the local branch that is already merged. If the branch is not merged yet, it stays on it and pulls what arrived on the remote. Leaves the repo ready to continue the work.
argument-hint: "[branch]"
---

# git:sync

The merge detection relies on the history. It assumes a merge without squash, where the commits of the branch reach the default branch as they were made. The `mr-no-squash` hook guarantees this for the PR/MR that Claude makes. A branch that another person merged with squash looks like a branch that is not merged (step 6).

## Steps

1. The working tree must be clean (`git status --short`). If there are changes, stop and offer `/git:commit` or `git stash`. Never discard them.
2. Run `git fetch --prune origin`. The default branch comes from `git symbolic-ref --short refs/remotes/origin/HEAD`, without the `origin/`.
3. Branch to sync: the argument or the current one. If it is already the default branch, run only `git pull --ff-only` and skip to step 6.
4. **Merged?** Run `git merge-base --is-ancestor <branch> origin/<default>`:
   - **yes**: run `git switch <default>`, `git pull --ff-only` and `git branch -d <branch>`. Use `-d`, never `-D`. If git refuses, the branch has a commit that is not in the default branch: stop and show which ones (`git log origin/<default>..<branch> --oneline`);
   - **no**: stay on the branch and bring what arrived on the remote (a suggestion applied in the review, a commit from a colleague) with `git pull --ff-only`. If the branch diverged, show the commits of each side and ask before `git pull --rebase`. Say that the branch is not merged yet.
5. If the remote branch still exists after the merge (`git ls-remote --heads origin <branch>`), warn the user: the merge did not delete the source branch. Do not delete the remote branch without asking.
6. Other local branches that are already merged: list them with `git branch --merged origin/<default>`, without the default branch and without the current one, and delete them with `git branch -d`. A branch whose remote is gone (`git branch -vv` with `gone`) but that is **not** merged stays. Tell the user its name and say that it can have been closed without a merge, or merged with squash.
7. Report in one line: the current branch, the commits pulled and the branches deleted.
