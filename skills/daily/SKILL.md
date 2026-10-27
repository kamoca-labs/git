---
name: daily
description: Collects what you did since the last business day (commits in all local repos, and PR/MR opened, merged and reviewed on GitHub and GitLab). Writes short talking points for the daily standup in the format yesterday, today and blockers, in the user's language.
argument-hint: "[since:yesterday|YYYY-MM-DD] [repos folder]"
---

# git:daily

Write the daily text in the user's language. If the user asks for another language, use that language.

## Period

Since the last business day: on Monday, look back to Friday. On the other days, look back to yesterday. The `since:` argument replaces the period. Calculate it with `date -d 'last friday' +%F` or `date -d yesterday +%F`.

## Collection

1. **Local commits** in all repos of the folder (default `~/Development`), on all branches, including those without a push. Filter by **name**, not by e-mail. The same author often commits with more than one e-mail (the local git one and the forge account one, used for merges in the web interface):
   ```bash
   name=$(git config --global user.name)
   for repo in $(find ~/Development -maxdepth 3 -name .git -type d -prune | xargs -n1 dirname); do
     log=$(git -C "$repo" log --all --no-merges --author="$name" --since="<since> 00:00" --format='%ad %s%n%b' --date=format:'%a %H:%M')
     [ -n "$log" ] && printf '## %s (%s)\n%s\n\n' "${repo##*/}" "$(git -C "$repo" remote get-url origin 2>/dev/null)" "$log"
   done
   ```
   Read the body too (`%b`). The title alone hides the effect. Commits from today are work in progress: they go under "Today", not under "Yesterday".
2. **Forges**: split the remotes from step 1 by forge and query each one. Load the `git:forge` skill (Skill tool) to choose the tool. If a forge has no MCP and no CLI with a login, continue with the commits only and warn the user.
   - **GitHub**: `search_pull_requests` (or `gh search prs`) with `author:@me` and with `reviewed-by:@me`, both with `updated:>=<since>`, and `review-requested:@me is:open` for the pending items. The search already returns the dates;
   - **GitLab**:
     - your user: `get_user` with `me: true`;
     - groups: the namespaces of the remotes (the path without the host, without `/gitlab` and without `.git`, up to the last `/`, for example `team`). Query **by group** (`group_id`): the query also returns the projects that you did not clone. The personal namespace (your username) is not a group: query it by `project_id`;
     - your MRs: `list_merge_requests` with `group_id`, `scope: created_by_me` and `state: all`;
     - MRs where you are a reviewer: the same query with `scope: review_requested`, once with `state: all` and once with `state: opened`, because MRs that have been idle for a long time do not appear among the recent ones;
     - **the GitLab listing has no dates.** It comes from newest to oldest, by **creation**. For each MR, `get_merge_request` gives the `updatedAt` and the `mergedAt`. Keep the ones updated in the period. An MR created days before can have its merge in the period. Stop only when the `createdAt` is 14 days before the start of the period.
   - **What you did on each PR/MR of the period**: read the notes and the reviews (`get_merge_request_notes` with `last: 100`, `get_pull_request_reviews`, `gh pr view <n> --json reviews,comments`). Count only your own, created in the period:
     - a regular or inline comment on the diff: "reviewed", with the number of comments;
     - an approval: "approved";
     - a change request: "requested changes";
     - your merge of a PR/MR from another person: "merged";
     - on your own PR/MR, the replies and the resolved threads go in the topic of that PR/MR.
     An open PR/MR where you are a reviewer and that has no note from you in the period becomes a pending item under "Today". If it has been open for more than 2 weeks, state its age.
   - **CI of your open PR/MR**: the last pipeline or workflow run (`get_merge_request_pipelines`, `gh pr checks`). A failure is a blocker.
3. **Current branch and uncommitted work** of the repo where Claude runs: `git status --short` and `git branch --show-current`. This is the most likely "today".

## Writing

One topic per **project**, with one line per delivery inside it. Never merge different projects into the same topic. Inside a project, group the commits of the same subject (five `fix(upload)` commits are one line) and describe the effect, not the code.

```
Yesterday
- billing-api
  - user photos served from a local copy, revalidated in alpha
  - MCP to manage OAuth clients (!19)
- web-app
  - /git:mr through the forge MCP (#5)
- reviewed the export MR from @jdoe (2 suggestions)

Today
- finish the upload tests and take the MR out of draft
- review MR !412

Blockers
- pipeline of !398 fails on the integration job (test environment down)
```

Translate the three headings (Yesterday, Today, Blockers) to the user's language.

- **Do not omit a delivery**: every `feat`, `fix`, `perf` and `revert` of the period appears, on its own line or together with others of the same subject. There is no limit on topics. Short lines (up to about 15 words) make the text concise. Do not cut work.
- A project that is not cloned (it appeared only on the forge): describe it from the commits of the PR/MR (`get_merge_request` with `include: ["commits"]`, `gh pr view <n> --json commits`).
- `chore`, `style`, `docs`, `test`, `ci` and `build` go grouped in one line of the project (for example "CI and deploy: ...") when they have a visible effect. Otherwise, leave them out.
- A local commit and a PR/MR of the same work are one line. Cite the number (`!iid` on GitLab, `#n` on GitHub).
- "Today" comes from what stays in progress: commits from today, draft PR/MR, a branch with commits and no PR/MR, a pending review assigned to you and a change without a commit.
- "Blockers" has only concrete facts: broken CI, a PR/MR idle for more than 2 days while it waits for someone, a dependency cited in the conversation. If there are none, write `No blockers`.

Reply with the daily text only. Then write one line with the number of repos and PR/MR that you included, so the user can check whether something is missing.
