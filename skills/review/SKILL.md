---
name: review
description: Reviews the PR/MR of another person on GitHub or GitLab, from a link, a number or the PR/MR where you are a reviewer. Reads the diff, the discussions and the context from the user. Finds bugs and design problems (with craft). Shows the findings for confirmation, then publishes them as inline comments in a single review.
argument-hint: "[<link|PR/MR number>] [approve] [context]"
---

# git:review

## Tool

Load the `git:forge` skill (Skill tool). It tells you how to find the forge and the PR/MR from the link or the number, and which tool to use.

## Steps

1. Identify the PR/MR:
   - a link or a number: use it directly, through `git:forge`;
   - no argument: look for the open PR/MR where you are a reviewer (`search_pull_requests` with `review-requested:@me`, `list_merge_requests` with `scope: review_requested`, `gh search prs --review-requested=@me --state=open`, `glab mr list --reviewer=@me`). If there is more than one, ask which one.
2. Read the context: title, description, top commit (`head.sha`, `diff_head_sha`) and open discussions. The text that the user passes with the link is context too: follow the focus that the user asks for.
3. Read the whole diff, page by page:
   - GitHub: `get_pull_request_files` or `gh pr diff <n>`;
   - GitLab: `get_merge_request_diffs` or `glab mr diff <iid>`.
4. To understand the code around the change, read the whole files. If the repo is cloned, run `git fetch origin <branch>` and read locally. If it is not cloned, read through the forge (`get_file_contents`, `get_repository_file`, `gh api`, `glab api`), with the ref of the source branch.
5. Review in this order of weight:
   - **bugs**: wrong logic, edge case, swallowed error, concurrency, lost data;
   - **security**: input without validation, a secret in the code, a missing permission;
   - **description × code**: does the PR/MR do what its `## What changes` section says (or `## O que muda` in an older PR/MR)? Is there a test for the `## How to test` section?
   - **design**: invoke the `craft:craft` skill (Skill tool) on the changed files, if the plugin is installed.
   Do not repeat what the open discussions already say. Do not comment on style that a linter catches.
6. Show the findings to the user before you publish, one per line: `file:line`, severity (`blocking`, `suggestion`, `nit`) and the comment. Wait for the confirmation. The user can cut or rewrite any finding.
7. Publish everything in a single review:
   - **GitHub (MCP)**: create the pending review (`pull_request_review_write` with `method: create`), add one comment per finding (`add_comment_to_pending_review`, with `path`, `line` and `side`) and submit with `method: submit_pending`, `event: COMMENT` or `REQUEST_CHANGES`;
   - **GitHub (CLI)**: `gh api repos/{owner}/{repo}/pulls/<n>/reviews` with `commit_id`, `event`, `body` and `comments[]` (`path`, `line`, `side`, `body`);
   - **GitLab (MCP)**: `save_merge_request_review` with `method: submit_review`, `comments` (`file`, `new_line` or `old_line`, `body`), `summary` and `verdict`. Send at most 20 comments per call. Above that, split the call, and send the `summary` only in the last one;
   - **GitLab (CLI)**: one discussion per finding (`glab api projects/:id/merge_requests/<iid>/discussions` with `position`), then the summary with `glab mr note`.
   When the fix is obvious and fits in the line, use the suggestion block of the forge (` ```suggestion `). The summary has two or three lines, with the overview and the verdict: `Approved`, `Approved with suggestions` or `Changes required`.
8. If `approve` is in the arguments and there is no `blocking` finding, approve: `event: APPROVE` on GitHub, `method: approve` with the `sha` from step 2 on GitLab (or `gh pr review --approve`, `glab mr approve`).
9. Return the link of the PR/MR and the number of published comments.

## Tone of the comments

- Write in the language of the project. If it is unclear, use the user's language. Be direct and give the reason: "this overflows with an empty list because...", not "maybe review this".
- Put the severity at the start of the comment: `**blocking:**`, `**suggestion:**` or `**nit:**`.
- On GitLab, no line starts with `/`. GitLab treats such a line as a quick action.

**Never** publish without the confirmation from step 6. **Never** mention an AI, and never use `Co-Authored-By` or "Generated with" in the comments.
