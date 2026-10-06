import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'single-item-commit'

test('aceita título com um assunto, inclusive literal entre crases', () => {
  const { commit } = sandbox()
  allowed(commit(RULE, `feat: add endpoint\n\n${BODY}`))
  allowed(commit(RULE, `fix: escape \`a & b\` in query\n\n${BODY}`))
})

test('nega conjunção no título', () => {
  const { commit } = sandbox()
  for (const title of ['add endpoint and fix login', 'add endpoint e login', 'add endpoint & login', 'add a + b']) {
    denied(commit(RULE, `feat: ${title}\n\n${BODY}`), /conjun/i)
  }
})
