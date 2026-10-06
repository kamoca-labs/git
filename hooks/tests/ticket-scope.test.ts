import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'ticket-scope'
const TICKET_PROMPT = '<command-name>/git:chamado</command-name>\n<command-args>19738 /git:commit</command-args>'

test('sem /git:chamado, qualquer escopo passa', () => {
  allowed(sandbox().commit(RULE, `feat(api): add endpoint\n\n${BODY}`))
})

test('com /git:chamado, exige o número como escopo', () => {
  const { commit, prompt } = sandbox()
  prompt(TICKET_PROMPT)
  allowed(commit(RULE, `feat(19738): add endpoint\n\n${BODY}`))
  denied(commit(RULE, `feat(api): add endpoint\n\n${BODY}`), /19738/)
})
