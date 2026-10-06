import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'no-co-author'

test('aceita commit sem atribuição', () => {
  allowed(sandbox().commit(RULE, `feat: add endpoint\n\n${BODY}`))
})

test('nega Co-Authored-By e rodapé do Claude', () => {
  const { commit } = sandbox()
  denied(commit(RULE, `feat: add endpoint\n\n${BODY}\n\nCo-Authored-By: X <x@x>`), /co-author/i)
  denied(commit(RULE, `feat: add endpoint\n\n${BODY}\n\nGenerated with [Claude Code]`), /co-author/i)
})
