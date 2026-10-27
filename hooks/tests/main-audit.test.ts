import assert from 'node:assert'
import fs from 'node:fs'
import { test } from 'node:test'
import { allowed, sandbox } from './helpers.ts'

const RULE = 'main-audit'

test('logs a commit made on main', () => {
  const { git, run, auditLog } = sandbox('main')
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'fix: patch prod')
  allowed(run(RULE, 'git commit -F -'))
  assert.match(fs.readFileSync(auditLog, 'utf8'), /fix: patch prod/)
})

test('does not log outside main or for a command that is not a commit', () => {
  const branch = sandbox()
  allowed(branch.run(RULE, 'git commit -F -'))
  assert.ok(!fs.existsSync(branch.auditLog))

  const main = sandbox('main')
  allowed(main.run(RULE, 'd=x; echo $d'))
  assert.ok(!fs.existsSync(main.auditLog))
})
