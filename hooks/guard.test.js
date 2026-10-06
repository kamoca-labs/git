#!/usr/bin/env node
const assert = require('node:assert')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync, execFileSync } = require('node:child_process')

const HOOK = path.join(__dirname, 'guard.js')
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'git-guard-'))
const repo = path.join(sandbox, 'repo')
const transcript = path.join(sandbox, 'transcript.jsonl')
const auditLog = path.join(sandbox, 'audit.log')

fs.mkdirSync(repo)
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
git('init', '-q', '-b', 'main')
git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'chore: init')

function prompt(text) {
  const entries = [
    { type: 'user', message: { role: 'user', content: text } },
    { type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'skill body /git:main /git:chamado 1' }] } },
  ]
  fs.writeFileSync(transcript, entries.map((entry) => JSON.stringify(entry)).join('\n'))
}

function run(mode, command) {
  const payload = { tool_name: 'Bash', tool_input: { command }, cwd: repo, transcript_path: transcript }
  return spawnSync('node', [HOOK, mode], {
    input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, GIT_GUARD_AUDIT_LOG: auditLog },
  })
}

const BODY = 'Por quê: o fluxo antigo quebrava no CE.\nO que: troca o endpoint.'
const commit = (message) => run('commit', `git commit -F - <<'EOF'\n${message}\nEOF`)
const allowed = (result) => assert.strictEqual(result.status, 0, result.stderr)
const denied = (result, pattern) => {
  assert.strictEqual(result.status, 2, `esperava negar: ${pattern}`)
  assert.match(result.stderr, pattern)
}

git('checkout', '-q', '-b', 'feat/x')
prompt('/git:commit')

allowed(commit(`feat(api): add endpoint\n\n${BODY}`))
allowed(run('commit', `git commit -m "fix: handle null" -m "${BODY}"`))
denied(commit('feat: add endpoint'), /body/i)
denied(commit(`add endpoint\n\n${BODY}`), /semântic/i)
denied(commit(`feat: add endpoint and fix login\n\n${BODY}`), /conjun/i)
denied(commit(`feat: add endpoint e login\n\n${BODY}`), /conjun/i)
denied(commit(`feat: add endpoint & login\n\n${BODY}`), /conjun/i)
denied(commit(`feat: ${'x'.repeat(80)}\n\n${BODY}`), /72/)
denied(commit(`feat: add endpoint\n\n${BODY}\n\nCo-Authored-By: X <x@x>`), /co-author/i)
denied(commit(`feat: add endpoint\n\n${'y'.repeat(120)}`), /linha/i)
denied(run('commit', 'git commit'), /mensagem/i)
allowed(run('commit', 'git commit --amend --no-edit'))
allowed(run('commit', 'd=/tmp/x; git -C $d init'))
allowed(run('push', 'b=main; echo $b'))

prompt('<command-message>git:chamado</command-message>\n<command-name>/git:chamado</command-name>\n<command-args>19738 /git:commit</command-args>')
allowed(commit(`feat(19738): add endpoint\n\n${BODY}`))
denied(commit(`feat(api): add endpoint\n\n${BODY}`), /19738/)

git('checkout', '-q', 'main')
const TRAILERS = 'Main-Justification: hotfix em produção\nMain-Risk: sem revisão'
prompt('/git:commit')
denied(commit(`fix: patch prod\n\n${BODY}\n\n${TRAILERS}`), /git:main/)
denied(run('push', 'git push origin HEAD'), /git:main/)
prompt('<command-name>/git:commit</command-name>\n<command-args>/git:main</command-args>')
denied(commit(`fix: patch prod\n\n${BODY}`), /Main-Justification/)
allowed(commit(`fix: patch prod\n\n${BODY}\n\n${TRAILERS}`))
allowed(run('push', 'git push origin HEAD'))

git('checkout', '-q', 'feat/x')
prompt('/git:commit')
denied(run('push', 'git push origin HEAD:main'), /git:main/)
allowed(run('push', 'git push -u origin HEAD'))

git('checkout', '-q', 'main')
prompt('/git:commit /git:main')
spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'fix: patch prod'], { cwd: repo })
allowed(run('audit', 'd=x; echo $d'))
assert.ok(!fs.existsSync(auditLog), 'auditou comando que não é commit')
allowed(run('audit', 'git commit -F -'))
assert.match(fs.readFileSync(auditLog, 'utf8'), /fix: patch prod/)

fs.rmSync(sandbox, { recursive: true, force: true })
console.log('git guard: ok')
