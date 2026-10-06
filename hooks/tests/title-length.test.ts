import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'title-length'

test('aceita título de até 72 chars', () => {
  allowed(sandbox().commit(RULE, `feat: ${'x'.repeat(66)}\n\n${BODY}`))
})

test('nega título acima de 72 chars', () => {
  denied(sandbox().commit(RULE, `feat: ${'x'.repeat(80)}\n\n${BODY}`), /72/)
})
