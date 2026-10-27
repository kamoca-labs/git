---
name: forge
description: How to find the forge (GitHub or GitLab) and the PR/MR, the pipeline or the project from a link, a number or the origin, and which tool to use (forge MCP, gh/glab CLI or a request to the user). Used by git:mr, git:review, git:ci, git:daily and git:release. Load it before you talk to the forge.
user-invocable: false
---

# git:forge

## Forge

Find the forge, in this order, from:

1. a link in the arguments or in the conversation: `github.com` is GitHub. A host with `/-/merge_requests/`, `/-/pipelines/` or `/-/jobs/` in the path is GitLab, even on a self-hosted instance;
2. the URL from `git remote get-url origin`, when there is no link.

A link can point to another repo, different from the current clone. In that case, read everything through the forge. Do not assume anything from the clone.

## Project and number

- **GitHub**: `owner/repo` from the path (`github.com/<owner>/<repo>/pull/<n>`, `/actions/runs/<id>`).
- **GitLab**: the path up to `/-/`, without the instance subpath (`/gitlab`), for example `team/billing-api`. The number comes after it (`/-/merge_requests/<iid>`, `/-/pipelines/<id>`, `/-/jobs/<id>`).
- No link: the project is the path of the `origin`, without the host, without the instance subpath and without `.git`.
- A number without a link (`12`, `!12`, `#12`) belongs to the project of the `origin`.

## Tool

1. If the session has an MCP server for that forge, use the MCP. The tool name has the form `mcp__<server>__<tool>`, for example `mcp__github__get_pull_request` or `mcp__plugin_gitlab_gitlab__get_merge_request`. If more than one server exists for the same forge, use the user's server, the one without the `plugin_` prefix.
2. If there is no MCP, use the CLI: `gh` on GitHub, `glab` on GitLab. For a self-hosted GitLab instance, pass `GITLAB_HOST=<host>` or `-R <host>/<project>`.
3. If the CLI cannot do what is missing, use the forge API through the CLI (`gh api`, `glab api`).
4. If the MCP asks for authentication, ask the user to authenticate in `/mcp`. If the CLI is missing or has no login, ask the user for permission to install it. Then do it and check that it works. An interactive login is the exception: hand the user the ready command to run with `!` (`! gh auth login`, `! glab auth login --hostname <host>`).

Choose the tool for each operation. An operation that the MCP does not have can go through the CLI, and the rest stays on the MCP.

## Never

- A commit through the forge API (`create_or_update_file`, `push_files`, `delete_file`, `add_commit`). The `no-api-commit` hook denies it. Use `/git:commit` and `git push`.
- Squash, on creation or on merge of the PR/MR. The `mr-no-squash` hook denies it.
- An AI mention, `Co-Authored-By` or "Generated with" in text published on the forge (PR/MR, comment, review, release).
