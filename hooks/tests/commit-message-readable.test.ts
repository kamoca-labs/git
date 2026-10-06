import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'commit-message-readable'

test('aceita mensagem por heredoc, -m ou --no-edit', () => {
  const { commit, run } = sandbox()
  allowed(commit(RULE, `feat: add endpoint\n\n${BODY}`))
  allowed(run(RULE, `git commit -m "fix: handle null" -m "${BODY}"`))
  allowed(run(RULE, 'git commit --amend --no-edit'))
})

test('nega commit sem mensagem legível', () => {
  denied(sandbox().run(RULE, 'git commit'), /mensagem não encontrada/i)
})

test('ignora comando que não é commit', () => {
  allowed(sandbox().run(RULE, 'd=/tmp/x; git -C $d init'))
})
