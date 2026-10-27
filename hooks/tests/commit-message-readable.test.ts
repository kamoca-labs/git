import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'commit-message-readable'

test('accepts a message from a heredoc, -m or --no-edit', () => {
  const { commit, run } = sandbox()
  allowed(commit(RULE, `feat: add endpoint\n\n${BODY}`))
  allowed(run(RULE, `git commit -m "fix: handle null" -m "${BODY}"`))
  allowed(run(RULE, 'git commit --amend --no-edit'))
})

test('denies a commit without a readable message', () => {
  denied(sandbox().run(RULE, 'git commit'), /message not found/i)
})

test('ignores a command that is not a commit', () => {
  allowed(sandbox().run(RULE, 'd=/tmp/x; git -C $d init'))
})
