import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'semantic-title'

test('accepts a semantic title, with or without a scope', () => {
  const { commit } = sandbox()
  allowed(commit(RULE, `feat(api): add endpoint\n\n${BODY}`))
  allowed(commit(RULE, `fix!: drop legacy flag\n\n${BODY}`))
})

test('denies a title that does not follow the format', () => {
  denied(sandbox().commit(RULE, `add endpoint\n\n${BODY}`), /semantic/i)
})

test('git -C does not hide the commit from the rule', () => {
  const { run } = sandbox()
  denied(run(RULE, `git -C . commit -m "update readme" -m "${BODY}"`), /semantic/i)
  denied(run(RULE, `git -c core.hooksPath=/dev/null commit -m "update readme" -m "${BODY}"`), /semantic/i)
})
