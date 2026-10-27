import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'title-length'

test('accepts a title of up to 72 chars', () => {
  allowed(sandbox().commit(RULE, `feat: ${'x'.repeat(66)}\n\n${BODY}`))
})

test('denies a title above 72 chars', () => {
  denied(sandbox().commit(RULE, `feat: ${'x'.repeat(80)}\n\n${BODY}`), /72/)
})
