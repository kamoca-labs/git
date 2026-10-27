# `git` plugin

## Contents

- [Installation](#installation)
- [Overview](#overview)
- [Commands](#commands)
- [Rules](#rules)
- [Commit on main](#commit-on-main)
- [Files](#files)
- [Use cases](USAGE.md)

## Installation

```bash
claude plugin marketplace add kamoca-labs/marketplace
claude plugin install git@kamoca
```

It needs Node 22.18 or later. The commands appear in the next session. The update steps are in the [marketplace README](https://github.com/kamoca-labs/marketplace#installation).

## Overview

Semantic, atomic and explained commits, always on a dedicated branch. A PR/MR has a short description, no squash and no AI mention. Each rule is its own hook. It denies a commit, a push or a PR/MR that does not follow the standard. The messages arrive with the rule name: `[git:<rule>] reason`.

## Commands

| Command | Arguments | What it does |
|---|---|---|
| `/git:commit` | `[/git:main] [/<plugin>:<command> ...] [instructions]` | Reads the diff and the conversation, groups the changes by subject, commits with a body and pushes. On main without `/git:main`, it creates a branch first. A command from another plugin in the arguments runs after the push |
| `/git:mr` | `[@reviewer ...\|@auto] [draft] [target:<branch>] [instructions]` | Opens the PR/MR on GitHub or GitLab through the forge MCP, or through the CLI (`gh`, `glab`) when there is no MCP. Semantic title, a description with **Why** and **What changes**, reviewers given or suggested from the history (`@auto`), draft and target. If the branch already has a PR/MR, it updates that PR/MR |
| `/git:review` | `[<link\|PR/MR number>] [approve] [context]` | Reviews the PR/MR of another person from the link, the number or your review queue. Shows the findings for confirmation and publishes them in a single review, with inline comments |
| `/git:ci` | `[<link\|PR/MR number\|pipeline id>] [retry] [context]` | Diagnoses GitHub Actions or GitLab CI: reads the log of the failed jobs, finds the cause and proposes the fix. With `retry`, it runs only the intermittent failures again |
| `/git:daily` | `[since:yesterday\|YYYY-MM-DD] [repos folder]` | Collects the commits of all local repos and the PR/MR from GitHub and GitLab since the last business day, and writes the daily (yesterday, today, blockers) in your language |
| `/git:release` | `[major\|minor\|patch\|vX.Y.Z] [rc]` | Calculates the version from the semantic commits, writes the changelog, and creates the annotated tag and the release on the forge. Claude cannot invoke it by itself |
| `/git:main` | `/git:commit [...]` | It only authorizes. Claude cannot invoke it by itself (`disable-model-invocation`) |
| `/git:sync` | `[branch]` | Merged: goes back to the updated default branch and deletes the local one with `-d`. Not merged: stays on it and runs `pull`. Cleans other branches that are already merged |
| `/git:split` | `[branch] [/<plugin>:<command> ...]` | Splits the branch into chained branches, one per subject, and checks that the sum reproduces the original. The original stays untouched |
| `/git:undo` | `[commit\|amend\|rebase\|merge\|reset\|branch <name>]` | Undoes through the reflog, with a backup branch first. On a shared branch it uses `revert` |

The commands that talk to the forge load the `git:forge` sub-skill. It finds the forge and the project from the link or the `origin`, and chooses the tool for each operation: the forge MCP when it exists, the CLI (`gh`, `glab`) when it does not, or a request that the user authenticates.

## Rules

The rules run on `git commit`, on `git push` and on PR/MR writes that Claude makes, through the CLI (`gh pr`, `glab mr`) or through the GitHub and GitLab MCP. The `git` that you type in the terminal does not pass through them.

| Rule (`hooks/rules/`) | Event | Limit | Denied example |
|---|---|---|---|
| `commit-message-readable` | commit | the message comes from `-m`, `-F <file>` or a heredoc; `--no-edit` passes | `git commit` that opens an editor |
| `semantic-title` | commit | `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `ci`, `build`, `revert` | `add endpoint` |
| `title-length` | commit | up to 72 chars | a title with 80 chars |
| `single-item-commit` | commit | no `and`, `&` or `+` in the title (a literal in backticks does not count) | `feat: add endpoint and fix login` |
| `commit-body` | commit | a body of 30 to 1000 chars, lines of up to 100 | the title only |
| `no-co-author` | commit | no `Co-Authored-By` and no "Generated with Claude" | a co-author trailer |
| `protected-branch-commit` | commit | on `main`/`master`, only with `/git:main` and the trailers | a commit on main without authorization |
| `protected-branch-push` | push | a push to `main`/`master` only with `/git:main`; a tag-only push (`refs/tags/...`) passes | `git push origin HEAD:main` |
| `mr-no-ai` | PR/MR | the title and the description have no `Co-Authored-By`, "Generated with", 🤖, session link or AI name (Claude, Anthropic, OpenAI, ChatGPT, GPT, Copilot, Gemini, Codex, DeepSeek); a file in backticks (`CLAUDE.md`) passes. It applies to `gh pr create\|edit\|comment\|review` and `glab mr create\|update\|note` | `Generated with [Claude Code]` at the end of the description |
| `mr-semantic-title` | PR/MR | a title in the semantic format; the `Draft: ` prefix does not count | `tweak upload` |
| `mr-title-length` | PR/MR | up to 72 chars, not counting `Draft: ` | a title with 80 chars |
| `mr-description` | PR/MR | a description of 80 to 3000 chars, required on creation | a PR/MR without a description |
| `mr-sections` | PR/MR | a description with `## Why` and `## What changes` (the Portuguese names `## Por quê` and `## O que muda` also pass) | a description without a section |
| `mr-no-squash` | PR/MR and merge | no squash; on the GitLab MCP, creation needs an explicit `squash: false` | `gh pr merge --squash` |
| `no-api-commit` | MCP | denies a commit through the forge API (`add_commit`, `create_or_update_file`, `push_files`, `delete_file`) | a file edited directly through the GitHub MCP |
| `main-audit` | after the commit | records each commit made on main | (it does not deny) |

## Commit on main

It needs `/git:main` in **your** prompt and two trailers in the body:

```
Main-Justification: why a branch and a PR/MR are not possible
Main-Risk: what can break and how to revert
```

Each allowed commit becomes a line in `~/.claude/git-main-audit.log` (date, repo, hash, title). The trailers also stay in the git history:

```bash
git log --grep 'Main-Risk:'
```

## Files

| Path | Role |
|---|---|
| `skills/commit/SKILL.md` | steps and format of the commit |
| `skills/main/SKILL.md` | authorization for main |
| `skills/mr/SKILL.md` | steps, format and commands of the PR/MR |
| `skills/forge/SKILL.md` | forge, project and tool (MCP, CLI or a request to the user), shared by the forge commands |
| `skills/review/SKILL.md` | PR/MR review with a confirmation before it publishes |
| `skills/ci/SKILL.md` | CI diagnosis and retry of intermittent failures |
| `skills/daily/SKILL.md` | collection of commits and PR/MR, and the daily text |
| `skills/release/SKILL.md` | version, changelog, tag and release |
| `skills/sync/SKILL.md` | goes back to the default branch after the merge and cleans the branches |
| `skills/split/SKILL.md` | splits the branch into chained parts |
| `skills/undo/SKILL.md` | recovery through the reflog, case by case |
| `hooks/hooks.json` | one hook per rule, each with its own `if:` and `statusMessage` |
| `hooks/lib.ts` | reads the payload, extracts the commit and PR/MR message (CLI and MCP), reads the prompt (`/git:main`) |
| `hooks/rules/<rule>.ts` | one rule per file |
| `hooks/tests/<rule>.test.ts` | the cases of each rule, in isolation |
| `hooks/tests/cases.json` | end-to-end use cases: each one passes through **all** hooks and declares which rules deny |
| `hooks/tests/cases.test.ts` | runs `cases.json` against `hooks.json` |
| `hooks/tests/capture.test.ts` | checks that a real denial becomes a case in `~/.claude/hook-cases.jsonl` |
| `hooks/tests/structure.test.ts` | checks that every rule has a dedicated hook and its own test |

Run: `node --test 'hooks/tests/*.test.ts'`. The steps to turn a real case into a test are in the [repo USAGE](https://github.com/kamoca-labs/marketplace/blob/main/USAGE.md#turn-a-real-case-into-a-test).
