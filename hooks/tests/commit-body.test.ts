import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'commit-body'

test('aceita body dentro dos limites', () => {
  allowed(sandbox().commit(RULE, `feat: add endpoint\n\n${BODY}`))
})

test('nega commit sem body', () => {
  denied(sandbox().commit(RULE, 'feat: add endpoint'), /body obrigatório/i)
})

test('nega body longo demais', () => {
  const body = Array.from({ length: 20 }, () => 'z'.repeat(60)).join('\n')
  denied(sandbox().commit(RULE, `feat: add endpoint\n\n${body}`), /1000/)
})

test('nega linha do body acima de 100 chars', () => {
  denied(sandbox().commit(RULE, `feat: add endpoint\n\n${'y'.repeat(120)}`), /linha/i)
})
