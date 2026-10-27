import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'single-item-commit'

test('accepts a title with one subject, including a literal in backticks', () => {
  const { commit } = sandbox()
  allowed(commit(RULE, `feat: add endpoint\n\n${BODY}`))
  allowed(commit(RULE, `fix: escape \`a & b\` in query\n\n${BODY}`))
})

test('denies a conjunction in the title', () => {
  const { commit } = sandbox()
  for (const title of ['add endpoint and fix login', 'add endpoint e login', 'add endpoint & login', 'add a + b']) {
    denied(commit(RULE, `feat: ${title}\n\n${BODY}`), /conjun/i)
  }
})
