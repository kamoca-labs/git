import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'no-co-author'

test('accepts a commit without attribution', () => {
  allowed(sandbox().commit(RULE, `feat: add endpoint\n\n${BODY}`))
})

test('denies Co-Authored-By and the Claude footer', () => {
  const { commit } = sandbox()
  denied(commit(RULE, `feat: add endpoint\n\n${BODY}\n\nCo-Authored-By: X <x@x>`), /co-author/i)
  denied(commit(RULE, `feat: add endpoint\n\n${BODY}\n\nGenerated with [Claude Code]`), /co-author/i)
})
