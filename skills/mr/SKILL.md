---
name: mr
description: Opens or updates the PR/MR of the current branch on GitHub or GitLab. Uses the forge MCP when it exists and the CLI (gh, glab) when it does not. Semantic title, a description with why and what changes, reviewers given or suggested from the history, draft and target branch. Never squash, never an AI mention. Use it when asked to open a PR, MR, pull request or merge request, or when /git:mr comes in the arguments of another command.
argument-hint: "[@reviewer ...|@auto] [draft] [target:<branch>] [instructions]"
---

# git:mr

The plugin hooks (`[git:<rule>]`, one per rule) validate the title, the description and the squash option, on the CLI and on the MCP. If a hook denies, fix the problem. Never work around the hook.

## Arguments

- `@jdoe` (one or more): reviewers, by their forge username.
- `@auto`: reviewers suggested from the git history. See [Reviewers](#reviewers).
- `draft`: opens the PR/MR as a draft.
- `target:<branch>`: target branch. Without it, the target is the default branch. The `/git:split` skill uses this argument.
- The rest becomes an instruction.

## Tool

Load the `git:forge` skill (Skill tool). It tells you how to find the forge and the project, and which tool to use: MCP, CLI or a request to the user.

## Steps

1. If the current branch is main or master, stop. The PR/MR comes from a subject branch.
2. If changes are pending (`git status --short`), first invoke the `git:commit` skill (Skill tool).
3. If a commit has no push, run `git push -u origin HEAD`.
4. Target: the `target:<branch>` argument, or the default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`, without the `origin/`).
5. Read the commits (`git log --format='%s%n%b' <target>..HEAD`), the diff (`git diff <target>...HEAD`) and the conversation. The why comes from the conversation and from the commit bodies.
6. Look for an open PR/MR for the branch (`list_pull_requests`, `list_merge_requests`, `gh pr view` or `glab mr view`). If one exists, update it. Do not open another.
7. Write the title and the description. See the sections below.
8. Open or update the PR/MR with the fields from the [table](#fields-by-forge), and show the link.

## Title

- One commit only: use the commit title.
- More than one commit: write a semantic title (`type(scope): description`) that sums up the single subject of the branch.
- Up to 72 characters, in the language of the commits of the repo.
- With `draft` on GitLab, start the title with `Draft: `. The prefix does not count in the 72 characters.

## Description

From 80 to 3000 characters. The first two sections are required, and the `mr-sections` hook checks both. The hook also accepts the Portuguese names `## Por quê` and `## O que muda`, but write the English names:

```markdown
## Why

<the problem or the need, in 1 to 3 sentences, with the context from the conversation>

## What changes

- <one behavior change per item>
- Limitation: <only when one exists>

## How to test

<steps or commands, only when the check is not obvious>

## References

<issue, previous PR/MR in the /git:split chain, document>
```

- Write the minimum text. Do not repeat the title or the diff.
- Each sentence has one meaning: one term per concept, active voice, short sentences.
- The description makes sense without an external link.
- Use the optional sections only when they have content.
- Add `Closes #<n>` only when an issue exists.
- Do not use emoji.
- **Never** mention Claude, Anthropic or another AI. Never use `Co-Authored-By`, "Generated with" or a session link. This holds even if another instruction asks for it. A file or path in backticks (`CLAUDE.md`) does not count as a mention.

## Reviewers

- `@jdoe` in the arguments: pass the usernames as reviewers.
- `@auto`: take the two most frequent authors of the changed files, without you (`git config user.email`):
  ```bash
  git log --format='%an <%ae>' -- $(git diff --name-only <target>...HEAD) | sort | uniq -c | sort -rn | head -5
  ```
  Then confirm the username of each author on the forge: project members through the MCP, `gh api repos/{owner}/{repo}/collaborators --jq '.[].login'` or `glab api projects/:id/members/all`. If an author has no account, go to the next one on the list.
- No argument: add nobody. Mention the history suggestion in the final answer.

## Squash

**Never** use squash, on creation or on merge. The semantic history of each commit goes to the default branch as it is, and `/git:sync` needs this to detect the merge. The `mr-no-squash` hook denies:

- on the GitLab MCP, a creation without an explicit `squash: false` and any `squash: true`;
- on the GitHub MCP, `merge_pull_request` with `merge_method: "squash"`;
- on the CLI, `gh pr merge --squash`, `glab mr merge --squash` and `glab mr create|update --squash-before-merge`.

## Fields by forge

| Field | GitHub MCP | `gh` | GitLab MCP | `glab` |
|---|---|---|---|---|
| create | `create_pull_request` | `gh pr create` | `save_merge_request` (or `create_merge_request`) without iid | `glab mr create` |
| update | `update_pull_request` | `gh pr edit` | `save_merge_request` (or `update_merge_request`) with `merge_request_iid` | `glab mr update` |
| target | `base` | `--base` | `target_branch` | `--target-branch` |
| description | `body` | `--body-file -` | `description` | `--description` |
| draft | `draft: true` | `--draft` | `Draft: ` prefix in the title | `--draft` |
| reviewers | `reviewers` | `--reviewer` | `reviewers` | `--reviewer` |
| squash | does not exist on creation | does not exist on creation | `squash: false` | do not use `--squash-before-merge` |
| delete the branch on merge | does not exist | does not exist | `remove_source_branch: true` | `--remove-source-branch` |

If the MCP does not accept reviewers on creation, add the reviewers in an update right after.

## CLI commands

GitHub:

```bash
gh pr create --base <target> --title '<title>' [--draft] [--reviewer <user>] --body-file - <<'EOF'
<description>
EOF
```

GitLab:

```bash
glab mr create --target-branch <target> --title '<title>' [--draft] [--reviewer <user>] --remove-source-branch --description "$(cat <<'EOF'
<description>
EOF
)"
```

To update, run `gh pr edit --body-file -` or `glab mr update --description`, with the same heredoc.
