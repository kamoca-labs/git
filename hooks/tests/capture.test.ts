import assert from 'node:assert'
import fs from 'node:fs'
import { test } from 'node:test'
import { allowed, BODY, sandbox } from './helpers.ts'

test('a real denial becomes a ready case for cases.json', () => {
  const box = sandbox('main')
  box.prompt('/git:commit')
  box.commit('semantic-title', `update readme\n\n${BODY}`)

  const [captured] = fs.readFileSync(box.casesLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.strictEqual(captured.plugin, 'git')
  assert.strictEqual(captured.origin, 'real')
  assert.strictEqual(captured.branch, 'main')
  assert.strictEqual(captured.prompt, '/git:commit')
  assert.strictEqual(captured.tool_name, 'Bash')
  assert.match(captured.tool_input.command, /update readme/)
  assert.deepStrictEqual(captured.deny, ['semantic-title'])
  assert.match(captured.description, /semantic/)
})

test('an allowed call does not create a case', () => {
  const box = sandbox()
  allowed(box.commit('semantic-title', `docs: update readme\n\n${BODY}`))
  assert.ok(!fs.existsSync(box.casesLog))
})
