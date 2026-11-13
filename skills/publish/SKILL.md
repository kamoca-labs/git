---
name: publish
description: Publishes the work in one command. Commits, opens the PR/MR, merges without squash, syncs and creates the new tag when it applies. manual asks before the merge, auto does not. Claude then continues the remaining work. Only the user calls it, with /git:publish.
argument-hint: "[auto|manual] [notag] [major|minor|patch] [@reviewer ...|@auto] [instructions]"
disable-model-invocation: true
---

# git:publish

Takes the finished work to the default branch: PR/MR, merge, sync and, when it applies, the new tag. The skill does not end the work. After the publish, Claude goes back to what was open before.

## Modes

- `manual` (the default): Claude opens the PR/MR and asks one question before the merge. Yes: it merges, creates the tag and goes on. No: it stops with the PR/MR open.
- `auto`: no question. Claude merges when the checks are green, creates the tag and goes on. Typing `auto` is the authorization to merge and to tag.

Both modes obey the forge: required approvals, required checks and branch protection. If the forge refuses the merge, Claude stops and says why. Never `--admin` and never a bypass.

## Arguments

- `auto` or `manual`.
- `notag`: no tag, even when one applies.
- `major`, `minor` or `patch`: forces the bump. Without it, the version comes from the commits, as in `git:release`.
- `@jdoe`, `@auto` and the rest go to `git:mr` as they are. A publish is never a draft.

## Tool

Read [../mr/references/forge.md](../mr/references/forge.md) with Read. It tells you how to find the forge and the project, and which tool to use.

## Steps

1. If changes are pending, invoke the `git:commit` skill (Skill tool). On main, it creates the branch. If the branch is still main or master, or has no commit ahead of the default branch, stop: there is nothing to publish.
2. Decide the tag. It applies only when both hold:
   - the repo already releases by tag: `git describe --tags --abbrev=0` finds one. Without a tag, there is no tag;
   - the commits since that tag (`git log <tag>..HEAD`) have a `feat`, a `fix`, a `perf` or a breaking change.
   `notag` also cancels it. Say the decision in one line.
   When it applies, `git:release` is user-only, so Claude cannot invoke it. Read [../release/SKILL.md](../release/SKILL.md) with Read and follow its steps 4 and 5 now: version and changelog. Keep both for step 8. If the repo has a `CHANGELOG.md`, write the entry there and leave it pending (the release rule: the file changes in the PR/MR, the tag comes after the merge). Update the version field that the repo keeps, if one exists.
3. Invoke the `git:mr` skill (Skill tool) with the reviewers, the target and the instructions from the arguments. It commits what is pending, pushes, and opens the PR/MR, or updates the one that already exists. If the PR/MR is already merged, skip to step 7.
4. Gate:
   - `manual`: show the link, a one-line summary and, when a tag applies, the version and the changelog. Ask one question: merge now (and create the tag `vX.Y.Z`, when one applies)? If the answer is no, stop. The PR/MR stays open, and `/git:publish` again resumes from here.
   - `auto`: go on.
5. Checks. If the pipeline is still running, wait with one blocking command, up to 15 minutes: `gh pr checks <n> --watch --fail-fast` or `glab ci status --branch <branch> --live`. With no checks configured, go on.
   - Failed: invoke the `git:ci` skill (Skill tool) for the diagnosis and stop. Do not merge.
   - Not finished in 15 minutes: stop and say that the pipeline is still running.
6. Merge with a merge commit, without squash, and delete the source branch. A rebase merge rewrites the commits, and `git:sync` could not detect the merge:
   - GitHub MCP: `merge_pull_request` with `merge_method: "merge"`. CLI: `gh pr merge <n> --merge --delete-branch`;
   - GitLab MCP: `accept_merge_request` with `squash: false` and the source branch removed. Pass `squash: false` always, because the project default can squash and the `mr-no-squash` hook checks only the creation. CLI: `glab mr merge <iid> --remove-source-branch --yes`.
   Check that the state is merged before you go on.
7. Invoke the `git:sync` skill (Skill tool): it goes back to the updated default branch and deletes the local branch.
8. Tag, only when step 2 said it applies. Read [../release/SKILL.md](../release/SKILL.md) with Read and follow its steps 7 to 9 with the version and the changelog from step 2. Skip its step 6: the approval already came from `manual` or from `auto`. Check that the tag exists on the remote (`git ls-remote --tags origin vX.Y.Z`). If the push fails, report it. Never force a tag.
9. Report in up to four lines: the PR/MR link, the merge, the tag and release link (when there is one) and the current branch. Then continue with the work that was open before the publish: the next item of the active activity or of the task list. New changes go to a new branch, through `git:commit`. If nothing else is open, stop here.

## Never

- Squash or rebase on the merge.
- Merge with a failed or unfinished check, or bypass a protection (`--admin`, a disabled rule).
- Create the tag before the merge, or on a branch that is not the updated default branch.
- Push to main. Main changes only through the merge of the PR/MR.
- Mention Claude or another AI in the PR/MR, in the changelog or in the release text.
