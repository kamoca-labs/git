import { test } from 'node:test'
import { allowed, denied, MERGE_REQUEST_WRITES, sandbox } from './helpers.ts'

const RULE = 'mr-title-length'
const TITLE_72 = `feat: ${'x'.repeat(66)}`

test('aceita título de até 72 chars', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: TITLE_72 })))
  }
})

test('nega título acima de 72 chars', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    denied(sandbox().call(RULE, write({ title: `feat: ${'x'.repeat(74)}` })), /\[git:mr-title-length\].*72/)
  }
})

test('o prefixo "Draft: " não entra na conta', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: `Draft: ${TITLE_72}` })))
  }
})
