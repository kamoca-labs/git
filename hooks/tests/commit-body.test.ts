import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'commit-body'

test('accepts a body within the limits', () => {
  allowed(sandbox().commit(RULE, `feat: add endpoint\n\n${BODY}`))
})

test('denies a commit without a body', () => {
  denied(sandbox().commit(RULE, 'feat: add endpoint'), /body required/i)
})

test('denies a body that is too long', () => {
  const body = Array.from({ length: 20 }, () => 'z'.repeat(60)).join('\n')
  denied(sandbox().commit(RULE, `feat: add endpoint\n\n${body}`), /1000/)
})

test('denies a body line above 100 chars', () => {
  denied(sandbox().commit(RULE, `feat: add endpoint\n\n${'y'.repeat(120)}`), /line/i)
})
