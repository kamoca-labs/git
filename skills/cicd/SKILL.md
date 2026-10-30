---
name: cicd
description: Creates or fixes the pipeline of the project on GitLab CI or GitHub Actions. The PR/MR runs the automated tests and the image build before the merge. The merge does not run the tests again, because they already passed on the same tree. The deploy uses the image of the commit SHA. Use when asked for a pipeline, CI/CD, tests before the merge, skipping the tests on the merge, or a deploy by SHA.
argument-hint: "[gitlab|github]"
---

# git:cicd

## The flow

The pipeline has three stages. Each one has one job in the flow.

| Moment | Tests | Build | Deploy |
|---|---|---|---|
| PR/MR open or updated | run, one job per stack, only when its folder changed | runs when the Docker files changed | never |
| Merge into the default branch | skip when the merge tree equals the PR/MR tree and that pipeline passed. Run in any other case | runs. The layer cache makes it fast | runs on the image tagged with the SHA of the pipeline |
| Manual run (web) | run | runs | runs, with the target the user picks |

- The merge is accepted only with a green pipeline (step 6).
- The image tag is the SHA of the commit that the pipeline runs. The deploy pulls that tag and never builds on the server.
- Re-running the deploy of an old SHA is the rollback, while the image exists in the registry.
- The skip needs a merge commit. A squash or a fast-forward has no second parent, so the check cannot match and the tests run again. This is safe, and `git:mr` forbids squash anyway.
- Any doubt runs the tests. A missing API answer, a missing pipeline or a different tree never skips them.

## Tool

Load the `git:forge` skill (Skill tool). It tells you how to find the forge and the project, and which tool to use.

## Steps

1. **Probe the project.** Read what exists before you write anything:
   - the forge and the default branch (`git:forge`);
   - the current pipeline (`.gitlab-ci.yml` or `.github/workflows/*.yml`);
   - the test command of each stack, from `package.json`, `composer.json`, `Makefile` or the docs (a test, `lint`, `typecheck` and `build` script);
   - a `docker/` folder and a `compose.prod.yaml`;
   - the runners that have Docker, the registry and the environments (staging, production).
2. **Show the plan and wait for approval.** Use a short table: the jobs of each stage, the folders that trigger them, the variables, the environments and what changes in the project settings.
3. **Write the pipeline** from the template of the forge, next to this skill: `gitlab-ci.yaml` (becomes `.gitlab-ci.yml`) or `github-actions.yaml` (becomes `.github/workflows/pipeline.yml`). Add one test job for each stack. Keep the guard of the skip in every test job.
4. **Write the check script** from the template of the forge: `check-tested.gitlab.sh` (becomes `.gitlab/check-tested.sh`) or `check-tested.github.sh` (becomes `.github/check-tested.sh`). Do not change its logic.
5. **Build and deploy the image.** If the project has `docker/` and `compose.prod.yaml`, load the `docker:ci` skill. It owns the build script, the registry, the deploy script and the strategy. Take the `build` and `deploy` jobs from its templates and keep the `needs` and the `rules` of this flow. If `docker:ci` is not in the skill list, the docker plugin is missing. Ask the user for permission, then run `claude plugin install docker@kamoca`. The skill loads in a new session, so say that and finish the other jobs first. Without Docker in the project, write only the test jobs and say that there is no build or deploy.
6. **Gate the merge.** With the approval of the user, set the project to accept the merge only with a green pipeline:
   - GitLab: `only_allow_merge_if_pipeline_succeeds: true` on the project (MCP, or `glab api -X PUT projects/:id`);
   - GitHub: a branch protection rule or a ruleset on the default branch, with the jobs of the test stage as required checks (`gh api`).
   A job that the pipeline skips counts as passed on both forges.
7. **Variables.** Set the non-secret variables with the approval of the user. Claude does not register secrets (SSH key, token). Give the user the variable name and where to set it.
8. **Prove it.** Open a PR/MR with a small change in one stack and check that:
   - only the tests of that stack run;
   - the merge pipeline prints that the tests already passed on this tree, and skips them;
   - the deploy ran with the SHA of the merge commit. Report the link of the pipeline.

## The check

The `check-tested` job runs only on the default branch. It writes the variable `SKIP_TESTS` (`1` or `0`):

1. The merge commit must have two parents. If not, `SKIP_TESTS=0`.
2. The tree of the merge commit must equal the tree of the second parent, which is the head of the PR/MR. If not, `SKIP_TESTS=0`.
3. The forge must report a passed pipeline for the SHA of that second parent. If not, or if the API fails, `SKIP_TESTS=0`.
4. Otherwise, `SKIP_TESTS=1`.

Each test job reads the variable first. With `SKIP_TESTS=1`, it ends at once (GitLab), or the job does not run (GitHub).

## Rules of the jobs

- Each test job runs only when the folder of its stack or the pipeline file changed.
- The test jobs publish a JUnit report and retry only on `runner_system_failure`. A real failure never retries by itself.
- The build uses no secret. The job sets a dummy value for each variable that `compose.prod.yaml` requires.
- The deploy job uses `needs` on the build and on the test jobs. A skipped test job does not block it.
- A deploy to production is manual (`web` trigger with the target), never automatic.
- Staging deploys on every merge. Give it a `resource_group` (GitLab) or a `concurrency` group (GitHub), so two deploys never run at the same time.

## Out of scope

- Review of a failed pipeline: use `git:ci`.
- The build script, the registry cache and the deploy script: they belong to `docker:ci`.
