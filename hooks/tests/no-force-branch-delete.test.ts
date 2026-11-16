import { test } from 'node:test'
import { allowed, denied, sandbox } from './helpers.ts'

const RULE = 'no-force-branch-delete'

test('a safe delete passes, because git refuses an unmerged branch', () => {
  allowed(sandbox().run(RULE, 'git branch -d feat/old'))
  allowed(sandbox().run(RULE, 'git branch --delete feat/old chore/older'))
})

test('ignores a command that is not a branch delete', () => {
  allowed(sandbox().run(RULE, 'git branch --merged origin/main'))
  allowed(sandbox().run(RULE, 'git branch -vv'))
  allowed(sandbox().run(RULE, 'git branch -f feat/old HEAD'))
  allowed(sandbox().run(RULE, 'git switch -c feat/new && git branch --show-current'))
  allowed(sandbox().run(RULE, 'git log -D'))
})

test('denies -D and asks for -d', () => {
  denied(sandbox().run(RULE, 'git branch -D feat/old'), /\[git:no-force-branch-delete\].*-d/)
  denied(sandbox().run(RULE, 'git branch -D -- v1.0.0'), /-d/)
  denied(sandbox().run(RULE, 'git -C ../app branch -D feat/old'), /-d/)
})

test('denies a delete that is forced by another spelling', () => {
  denied(sandbox().run(RULE, 'git branch -d -f feat/old'), /-d/)
  denied(sandbox().run(RULE, 'git branch -df feat/old'), /-d/)
  denied(sandbox().run(RULE, 'git branch -fd feat/old'), /-d/)
  denied(sandbox().run(RULE, 'git branch --delete --force feat/old'), /-d/)
  denied(sandbox().run(RULE, 'git branch -d --force feat/old'), /-d/)
})

test('denies the forced delete inside a chain of commands', () => {
  denied(sandbox().run(RULE, 'git fetch --prune && git branch -D feat/old'), /-d/)
  denied(sandbox().run(RULE, 'git branch -d feat/a; git branch -D feat/b'), /-d/)
})

test('the message says to stop and show the commits when git refuses', () => {
  denied(sandbox().run(RULE, 'git branch -D feat/old'), /refuses.*(stop|show)/i)
})

test('a -D inside a heredoc or a commit message passes', () => {
  allowed(sandbox().commit(RULE, 'docs: explain why git branch -D is denied\n\nWhy: the skill says -d.'))
})
