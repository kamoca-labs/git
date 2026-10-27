---
name: ci
description: Diagnoses the CI of the current branch, of a PR/MR or of a pipeline link, on GitHub Actions or GitLab CI. Reads the log of the failed jobs, finds the cause and proposes the fix. With retry, it runs the jobs again when the failure is intermittent.
argument-hint: "[<link|PR/MR number|pipeline id>] [retry] [context]"
---

# git:ci

## Tool

Load the `git:forge` skill (Skill tool). It tells you how to find the forge and the project from the link or the origin, and which tool to use.

On GitHub, the pipeline is the Actions **workflow run**. On GitLab, it is the **pipeline**. The text below uses "pipeline" for both.

## Steps

1. Find the pipeline:
   - a link or a pipeline id: use it directly;
   - a PR/MR (link or number): the most recent pipeline of the top commit (`list_workflow_runs` with `head_sha`, `gh pr checks <n>`, `get_merge_request_pipelines`, `glab ci list --mr <iid>`);
   - no argument: the most recent one of the current branch (`git branch --show-current`): `list_workflow_runs` with `branch`, `gh run list --branch <b>`, `list_pipelines` with `ref`, `glab ci list --ref <b>`.
2. If the pipeline is still running, say so and list the jobs that are missing. Do not wait.
3. List the jobs and take the ones that failed, without the ones that may fail (`continue-on-error`, `allow_failure`): `list_workflow_jobs`, `gh run view <id>`, `get_pipeline_jobs`, `glab ci view`.
4. Read the log of each failed job. The error is usually at the end of the log:
   - GitHub: `get_job_logs` with `failed_only` and `tail_lines`, or `gh run view <id> --log-failed`;
   - GitLab: `get_job` with `include: ["log"]`, from the last 50 KB (`byte_offset` = size − 51200), or `glab ci trace <job>`.
   If the cause is not in the excerpt, go back in the log.
5. Classify each failure:
   - **code**: a test, lint, build or type that the change broke. Find the file and the line in the local repo and propose the fix;
   - **intermittent**: timeout, network, a runner without space, a registry that is down, a test that passes on the target branch. Suggest `retry`;
   - **configuration**: a workflow (`.github/workflows/*.yml`) or `.gitlab-ci.yml`, a missing variable or secret, an image that does not exist. Point to the line of the file.
   To know whether the failure is new, compare it with the last pipeline of the target branch.
6. Answer with one line per job: `job (stage)`, the cause in one sentence, the log excerpt that proves the cause (up to 10 lines) and the fix.
7. If `retry` is in the arguments and all failures are intermittent, run only the failed jobs again: `rerun_failed_jobs` or `gh run rerun <id> --failed` on GitHub, `retry_pipeline` or `glab ci retry <job>` on GitLab. A code failure does not go away with a retry: say so and do not run it.

Do not fix the code unless the user asks. If the user asks, after the fix, invoke the `git:commit` skill (Skill tool).
