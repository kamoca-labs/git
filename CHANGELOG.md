# Changelog

Notes reconstructed from commits and manifest versions. Historical dates identify recorded version changes rather than previously published tags. Later refinements at the same manifest version are included with that version. Empty categories are omitted.

## Unreleased

### Improvements

- Claude sees fewer skills and shorter descriptions. The listing drops from 10 skills with 2,719 description characters to 9 skills with 2,120. The descriptions of `/git:mr`, `/git:ci-cd` and `/git:review` have 300 characters or fewer.
- `scripts/skill-budget.ts` prints the skills that Claude sees and the sum of their description characters.
- The structure test guards the skill layout: the visible skills, the description length and the links to each reference.

### Breaking changes

- `git:forge` is no longer a skill. Its text moved to `skills/mr/references/forge.md`. The forge commands read this file with Read.

## 0.8.0 (2026-11-04)

### New features

- `/git:commit` keeps a structural change (`refactor`, `perf`) and a behavior change (`feat`, `fix`) in separate commits, in this order: preparatory refactor, behavior, cleanup refactor. This rule moved here from `craft:atdd`.

## 0.7.0 — 2026-10-30

### New features

- `/git:ci-cd` creates or repairs GitHub/GitLab pipelines that test and build in the PR/MR, avoid repeating tests for an already-tested identical tree and deploy the image tagged with the commit SHA.
- Gate merging on successful pipeline results.

### Improvements

- Standardize the pipeline command name as `/git:ci-cd` rather than the initial `cicd` spelling.
- Add the plugin icon and MIT licensing information.

Evidence: [pipeline workflow](https://github.com/kamoca-labs/git/commit/9f5d173), [command naming](https://github.com/kamoca-labs/git/commit/ac556ef), [packaging](https://github.com/kamoca-labs/git/commit/07820e5).

## 0.6.0 — 2026-10-20

### New features

- Validate semantic PR/MR titles, title length, description length/sections and no-squash rules across CLI and supported forge MCP operations.
- Support reviewer selection, history-based reviewer suggestions, draft status and explicit target branches.
- Share forge discovery and tool selection across GitHub and GitLab workflows.
- Add forge-neutral review, CI diagnosis, daily reporting and release workflows formerly limited to the separate GitLab plugin.

### Fixes

- Evaluate the actual target repository for `cd <dir>` and `git -C <dir>` commands, preventing false protected-branch denials and missed checks in another repository. Recognize supported Git global options before the subcommand.

### Improvements

- Apply attribution restrictions to supported MCP PR/MR writes and block direct API commit paths covered by the hooks.
- Publish standalone English skills, documentation and hook messages while keeping replies in the user's language and accepting the documented Portuguese section labels.

Evidence: [repository-resolution fix](https://github.com/kamoca-labs/git/commit/2ae936e), [PR/MR guards](https://github.com/kamoca-labs/git/commit/0181958), [reviewers and targets](https://github.com/kamoca-labs/git/commit/b7242d7), [forge lookup](https://github.com/kamoca-labs/git/commit/a7c4da4), [forge workflows](https://github.com/kamoca-labs/git/commit/c491765).

## 0.5.0 — 2026-10-15

### New features

- `/git:mr` opens or updates GitHub/GitLab PR/MRs with a semantic title and Why/What changes sections, and can follow `/git:commit`.
- Reject attribution footers, coauthor text and prohibited mentions in PR/MR titles and descriptions.

Evidence: [PR/MR workflow](https://github.com/kamoca-labs/git/commit/dfa2bef).

## 0.4.0 — 2026-10-06

### Breaking changes

- Remove the work-specific `/git:chamado` command and ticket-scope rule from the general plugin.
- Adopt the kamoca marketplace identity; migrate older `@kauan` installations to `@kamoca`.

### New features

- `/git:sync` returns to the updated default branch after a history-preserving merge, safely removes merged local branches and retains unmerged work.

### Improvements

- Let commit/split pass commands from other plugins without a hard-coded GitLab dependency.
- Rename the historical `/git:desfazer` command to `/git:undo` in the subsequent same-version refinement on 2026-10-11. Update old command invocations.

Evidence: [forge-neutral scope](https://github.com/kamoca-labs/git/commit/359d197), [sync](https://github.com/kamoca-labs/git/commit/1f4ccdc), [undo naming](https://github.com/kamoca-labs/git/commit/0fba291), [identity](https://github.com/kamoca-labs/git/commit/5ce388f).

## 0.3.0 — 2026-10-06

### New features

- Split a large branch into subject-based stacked branches while retaining the original and verifying the resulting combined tree.
- Introduce the historical reflog-based undo workflow with backup branches, shared-branch reverts and guarded force-with-lease behavior.

### Fixes

- Allow pushes containing only explicit tag refspecs from the default branch, while continuing to protect branch pushes and mixed refspecs.

Evidence: [stacked branches](https://github.com/kamoca-labs/git/commit/2d73269), [undo](https://github.com/kamoca-labs/git/commit/e2cb194), [tag-only push fix](https://github.com/kamoca-labs/git/commit/d060067).

## 0.2.0 — 2026-10-06

### Breaking changes

- Require Node 22.18 or later for the TypeScript hook distribution.

### Improvements

- Replace the monolithic guard with one named hook per rule and dedicated rule, capture, case and structure checks.
- Treat the explicit `/git:main` modifier as authorization for the audited main workflow without a second confirmation.

Evidence: [hook split](https://github.com/kamoca-labs/git/commit/f0d5a5b).

## 0.1.0 — 2026-10-06

### New features

- Introduce atomic semantic commits with explanatory bodies, dedicated branches and protected default-branch pushes.
- Add the explicitly authorized, audited main workflow and the original work-specific ticket command, later removed in 0.4.0.
- Validate commit messages and reject coauthor attribution.

Evidence: [initial plugin](https://github.com/kamoca-labs/git/commit/df76e91).
