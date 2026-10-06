import { test } from 'node:test'
import { allowed, BODY, denied, sandbox, TRAILERS } from './helpers.ts'

const RULE = 'protected-branch-commit'
const MAIN_PROMPT = '<command-name>/git:commit</command-name>\n<command-args>/git:main</command-args>'

test('fora da main, passa sem trailers', () => {
  allowed(sandbox().commit(RULE, `fix: patch\n\n${BODY}`))
})

test('na main, nega sem /git:main no prompt do usuário', () => {
  const { commit, run } = sandbox('main')
  denied(commit(RULE, `fix: patch\n\n${BODY}\n\n${TRAILERS}`), /git:main/)
  denied(run(RULE, 'git commit --amend --no-edit'), /git:main/)
})

test('na main com /git:main, exige os trailers', () => {
  const { commit, prompt } = sandbox('main')
  prompt(MAIN_PROMPT)
  denied(commit(RULE, `fix: patch\n\n${BODY}`), /Main-Justification/)
  allowed(commit(RULE, `fix: patch\n\n${BODY}\n\n${TRAILERS}`))
})
