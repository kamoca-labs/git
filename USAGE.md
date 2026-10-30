# Using the `git` plugin

## Contents

- [Commit what is pending](#commit-what-is-pending)
- [Commit and chain another command](#commit-and-chain-another-command)
- [Open the PR/MR](#open-the-prmr)
- [Review the PR/MR of another person](#review-the-prmr-of-another-person)
- [Diagnose the CI](#diagnose-the-ci)
- [Write the daily](#write-the-daily)
- [Release a version](#release-a-version)
- [Give extra instructions](#give-extra-instructions)
- [Hotfix directly on main](#hotfix-directly-on-main)
- [When the hook denies](#when-the-hook-denies)
- [Check the audit](#check-the-audit)

## Commit what is pending

```
/git:commit
```

Claude reads `git status`, the diff and the conversation. It separates the changes by subject and makes one commit per subject:

```
fix(upload): reject files above the size limit

Why: attachments above 10 MB blocked the processing queue.
What: validates the size before queueing and returns 422 with the message.
```

If you are on main, Claude creates a branch (`fix/reject-large-attachment`) before it commits.

## Commit and chain another command

```
/git:commit /<plugin>:<command> @jdoe
```

It makes the commits and the push. Then it invokes the command from the other plugin with the rest of the arguments (for example, to open the PR/MR with a reviewer). The `git` plugin does not depend on any plugin: any installed plugin works.

## Open the PR/MR

```
/git:mr
/git:mr @jdoe @asmith
/git:mr @auto draft
/git:mr target:feat/upload-1
/git:commit /git:mr @auto
```

Claude opens the PR/MR of the branch on GitHub or GitLab, according to the `origin`. If the session has the forge MCP, Claude uses the MCP. If it does not, Claude uses the CLI (`gh` or `glab`).

The title follows the commit. The description has two required sections and two optional ones:

```markdown
## Why

Attachments above 10 MB blocked the processing queue.

## What changes

- Validates the size before queueing and returns 422.

## How to test

Send an 11 MB attachment and check the 422 response.
```

- `@jdoe`: adds the reviewer by username.
- `@auto`: adds the two most frequent authors of the changed files, without you.
- `draft`: opens it as a draft (`--draft`, or `Draft: ` in the GitLab title).
- `target:<branch>`: changes the target branch. The `/git:split` command uses this argument on each part.

The PR/MR never uses squash, on creation or on merge. On GitLab, the MR has the option to delete the source branch on merge.

## Review the PR/MR of another person

```
/git:review https://github.com/acme/app/pull/12
/git:review https://gitlab.example.com/team/app/-/merge_requests/34 focus on the migration
/git:review 12 approve
/git:review
```

Claude reads the diff, the discussions and the context that you pass. It shows the findings (`file:line`, severity and comment). Nothing is published before your confirmation. Then the findings go out in a single review, with inline comments. With no argument, Claude looks for the PR/MR where you are a reviewer.

## Diagnose the CI

```
/git:ci
/git:ci https://github.com/acme/app/actions/runs/123
/git:ci !34 retry
```

One line per failed job: the cause, the log excerpt that proves the cause and the fix. `retry` runs again only when all failures are intermittent.

## Set up the pipeline

```
/git:cicd
/git:cicd github
```

Claude reads the project (stacks, tests, `docker/`, runners, registry) and shows a plan. It waits for your approval. Then it writes the pipeline: the PR/MR runs the tests of the stacks that changed and builds the image. On the merge, a `check-tested` job compares the tree of the merge commit with the tree of the PR/MR. If they are equal and that pipeline passed, the tests do not run again. The deploy uses the image of the commit SHA. With your approval, Claude also sets the project to accept the merge only with a green pipeline. Claude does not register secrets: it tells you the variable name and where to set it.

## Write the daily

```
/git:daily
/git:daily since:2026-10-16
```

Claude collects your commits from all repos in `~/Development` and the PR/MR from GitHub and GitLab. It writes the topics for yesterday, today and blockers in your language.

## Release a version

```
/git:release
/git:release minor rc
```

Claude calculates the version from the commits, shows the changelog and waits for your approval. Then it creates the annotated tag, pushes only the tag and creates the release on the forge.

## Give extra instructions

Everything that is not a modifier becomes an instruction:

```
/git:commit only the backend files, leave the frontend for later
/git:commit separate the migration from the rest
```

## Hotfix directly on main

```
/git:commit /git:main
```

1. Claude writes the justification and the risk in the body and commits without a confirmation request (`/git:main` is already the authorization).
2. The commit has the trailers:

```
fix: restore login after expired certificate

Why: production is down and there is no time for a PR/MR cycle.
What: replaces the expired certificate with the renewed one.

Main-Justification: production incident, login unavailable for everyone
Main-Risk: no review; revert with git revert <hash>
```

3. The commit goes to `~/.claude/git-main-audit.log`.

`/git:main` holds only for the prompt where you typed it. In the next prompt, main is protected again.

## When the hook denies

Claude receives `[git:<rule>] reason` (all the violated rules at once), fixes the problem and tries again:

| Hook message | Denied call | Fix |
|---|---|---|
| `Title does not follow the semantic format` | `update README` | `docs: update install steps` |
| `Conjunction (and/&/+) in the title` | `feat: add export and import` | two commits: `feat: add export`, `feat: add import` |
| `Title has 81 chars, maximum 72` | a long title | shorten it; the detail goes in the body |
| `Body required` | `fix: typo` without a body | a body with why and what |
| `Body line above 100 chars` | a paragraph on one line | wrap the line |
| `Co-author or attribution lines are not allowed` | `Co-Authored-By: ...` | remove the trailer |
| `A commit on main needs /git:main in your prompt` | a commit on main | create a branch or use `/git:main` |
| `Message not found` | `git commit` without `-m` | `git commit -F - <<'EOF' ... EOF` |
| `PR/MR text must not mention AI` | a description with `Generated with [Claude Code]` | remove the line |
| `PR/MR title does not follow the semantic format` | `tweak upload` | `fix(upload): reject large files` |
| `PR/MR description is missing the required sections: ## What changes` | a description with only the why | add the section |
| `Never squash` | `gh pr merge --squash` | `gh pr merge --merge` |
| `Pass squash: false when you create the MR` | `save_merge_request` without `squash` | add `squash: false` |
| `A commit through the forge API skips the commit rules` | `create_or_update_file` on the GitHub MCP | `/git:commit` |

## Check the audit

```bash
column -t -s $'\t' ~/.claude/git-main-audit.log
git log --grep 'Main-Justification:' --format='%h %ad %s' --date=short
```
