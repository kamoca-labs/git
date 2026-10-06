import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'semantic-title'

test('aceita título semântico, com ou sem escopo', () => {
  const { commit } = sandbox()
  allowed(commit(RULE, `feat(api): add endpoint\n\n${BODY}`))
  allowed(commit(RULE, `fix!: drop legacy flag\n\n${BODY}`))
})

test('nega título fora do padrão', () => {
  denied(sandbox().commit(RULE, `add endpoint\n\n${BODY}`), /semântic/i)
})
