import assert from 'node:assert'
import { execFileSync, spawnSync, type SpawnSyncReturns } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const RULES = path.join(import.meta.dirname, '..', 'rules')

export const BODY = 'Por quê: o fluxo antigo quebrava no CE.\nO que: troca o endpoint.'
export const TRAILERS = 'Main-Justification: hotfix em produção\nMain-Risk: sem revisão'

export type Sandbox = {
  repo: string
  auditLog: string
  casesLog: string
  git: (...args: string[]) => string
  prompt: (text: string) => void
  run: (rule: string, command: string) => SpawnSyncReturns<string>
  commit: (rule: string, message: string) => SpawnSyncReturns<string>
}

export function sandbox(branch = 'feat/x'): Sandbox {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'git-hooks-'))
  const repo = path.join(root, 'repo')
  const transcript = path.join(root, 'transcript.jsonl')
  const auditLog = path.join(root, 'audit.log')
  const casesLog = path.join(root, 'cases.jsonl')
  fs.mkdirSync(repo)

  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
  git('init', '-q', '-b', 'main')
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'chore: init')
  if (branch !== 'main') git('checkout', '-q', '-b', branch)

  const prompt = (text: string) => {
    const entries = [
      { type: 'user', message: { role: 'user', content: text } },
      { type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'skill /git:main /git:chamado 1' }] } },
    ]
    fs.writeFileSync(transcript, entries.map((entry) => JSON.stringify(entry)).join('\n'))
  }
  prompt('/git:commit')

  const run = (rule: string, command: string) => spawnSync('node', [path.join(RULES, `${rule}.ts`)], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd: repo, transcript_path: transcript }),
    encoding: 'utf8',
    env: { ...process.env, GIT_GUARD_AUDIT_LOG: auditLog, HOOK_CASES_LOG: casesLog },
  })
  const commit = (rule: string, message: string) => run(rule, `git commit -F - <<'EOF'\n${message}\nEOF`)

  return { repo, auditLog, casesLog, git, prompt, run, commit }
}

export function allowed(result: SpawnSyncReturns<string>) {
  assert.strictEqual(result.status, 0, result.stderr)
}

export function denied(result: SpawnSyncReturns<string>, pattern: RegExp) {
  assert.strictEqual(result.status, 2, `esperava negar com ${pattern}`)
  assert.match(result.stderr, pattern)
}
