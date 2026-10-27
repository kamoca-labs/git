import { test } from 'node:test'
import { allowed, BODY, denied, otherRepo, sandbox, TRAILERS } from './helpers.ts'

const RULE = 'protected-branch-commit'
const MAIN_PROMPT = '<command-name>/git:commit</command-name>\n<command-args>/git:main</command-args>'

test('outside main, it passes without trailers', () => {
  allowed(sandbox().commit(RULE, `fix: patch\n\n${BODY}`))
})

test('on main, it denies without /git:main in the user prompt', () => {
  const { commit, run } = sandbox('main')
  denied(commit(RULE, `fix: patch\n\n${BODY}\n\n${TRAILERS}`), /git:main/)
  denied(run(RULE, 'git commit --amend --no-edit'), /git:main/)
})

test('on main with /git:main, it requires the trailers', () => {
  const { commit, prompt } = sandbox('main')
  prompt(MAIN_PROMPT)
  denied(commit(RULE, `fix: patch\n\n${BODY}`), /Main-Justification/)
  allowed(commit(RULE, `fix: patch\n\n${BODY}\n\n${TRAILERS}`))
})

test('checks the branch of the repo from cd or git -C, not the session branch', () => {
  const { run } = sandbox('main')
  const repo = otherRepo('feat/x')
  allowed(run(RULE, `cd ${repo} && git commit -F - <<'EOF'\nfix: patch\n\n${BODY}\nEOF`))
  allowed(run(RULE, `git -C ${repo} commit -F - <<'EOF'\nfix: patch\n\n${BODY}\nEOF`))
})

test('a cd to another repo on main does not escape the rule', () => {
  const { run } = sandbox('feat/x')
  const repo = otherRepo('main')
  denied(run(RULE, `cd ${repo} && git commit -F - <<'EOF'\nfix: patch\n\n${BODY}\nEOF`), /git:main/)
  denied(run(RULE, `git -C "${repo}" commit -F - <<'EOF'\nfix: patch\n\n${BODY}\nEOF`), /git:main/)
})
