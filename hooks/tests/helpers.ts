import assert from 'node:assert'
import { execFileSync, spawnSync, type SpawnSyncReturns } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const RULES = path.join(import.meta.dirname, '..', 'rules')

export const BODY = 'Por quê: o fluxo antigo quebrava no CE.\nO que: troca o endpoint.'
export const TRAILERS = 'Main-Justification: hotfix em produção\nMain-Risk: sem revisão'

export const MR_TITLE = 'fix(upload): reject files above the size limit'
export const MR_DESCRIPTION = '## Por quê\n\nAnexos acima de 10 MB travavam a fila de processamento.\n\n## O que muda\n\n- Valida o tamanho antes de enfileirar.'

export type ToolCall = { tool_name: string, tool_input: Record<string, unknown> }

export type MergeRequestFields = { title?: string, description?: string }

export type Sandbox = {
  repo: string
  auditLog: string
  casesLog: string
  git: (...args: string[]) => string
  prompt: (text: string) => void
  call: (rule: string, toolCall: ToolCall) => SpawnSyncReturns<string>
  run: (rule: string, command: string) => SpawnSyncReturns<string>
  commit: (rule: string, message: string) => SpawnSyncReturns<string>
}

const bash = (command: string): ToolCall => ({ tool_name: 'Bash', tool_input: { command } })

const quoted = (flag: string, value?: string) => (value === undefined ? '' : ` ${flag} '${value}'`)

const heredoc = (value?: string) => (value === undefined ? '' : ` <<'EOF'\n${value}\nEOF`)

const glabDescription = (value?: string) =>
  (value === undefined ? '' : ` --description "$(cat <<'EOF'\n${value}\nEOF\n)"`)

export const ghCreate = ({ title, description }: MergeRequestFields) =>
  bash(`gh pr create --base main${quoted('--title', title)}${description === undefined ? '' : ' --body-file -'}${heredoc(description)}`)

export const glabCreate = ({ title, description }: MergeRequestFields) =>
  bash(`glab mr create --target-branch main${quoted('--title', title)}${glabDescription(description)}`)

export const githubMcpCreate = ({ title, description }: MergeRequestFields): ToolCall => ({
  tool_name: 'mcp__github__create_pull_request',
  tool_input: { owner: 'kamoca', repo: 'app', head: 'fix/upload', base: 'main', title, body: description },
})

export const gitlabMcpCreate = ({ title, description }: MergeRequestFields): ToolCall => ({
  tool_name: 'mcp__plugin_gitlab_gitlab__save_merge_request',
  tool_input: { project_id: 'kamoca/app', source_branch: 'fix/upload', target_branch: 'main', title, description, squash: false },
})

export const ghEdit = ({ title, description }: MergeRequestFields) =>
  bash(`gh pr edit 2${quoted('--title', title)}${quoted('--body', description)}`)

export const glabUpdate = ({ title, description }: MergeRequestFields) =>
  bash(`glab mr update 12${quoted('--title', title)}${quoted('--description', description)}`)

export const githubMcpUpdate = ({ title, description }: MergeRequestFields): ToolCall => ({
  tool_name: 'mcp__github__update_pull_request',
  tool_input: { owner: 'kamoca', repo: 'app', pullNumber: 2, title, body: description },
})

export const gitlabMcpUpdate = ({ title, description }: MergeRequestFields): ToolCall => ({
  tool_name: 'mcp__gitlab__save_merge_request',
  tool_input: { project_id: 'kamoca/app', merge_request_iid: 12, title, description },
})

export const MERGE_REQUEST_CREATES = [ghCreate, glabCreate, githubMcpCreate, gitlabMcpCreate]

export const MERGE_REQUEST_UPDATES = [ghEdit, glabUpdate, githubMcpUpdate, gitlabMcpUpdate]

export const MERGE_REQUEST_WRITES = [...MERGE_REQUEST_CREATES, ...MERGE_REQUEST_UPDATES]

function initRepo(repo: string, branch: string) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
  git('init', '-q', '-b', 'main')
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'chore: init')
  if (branch !== 'main') git('checkout', '-q', '-b', branch)
  return git
}

export function sandbox(branch = 'feat/x'): Sandbox {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'git-hooks-'))
  const repo = path.join(root, 'repo')
  const transcript = path.join(root, 'transcript.jsonl')
  const auditLog = path.join(root, 'audit.log')
  const casesLog = path.join(root, 'cases.jsonl')
  fs.mkdirSync(repo)

  const git = initRepo(repo, branch)

  const prompt = (text: string) => {
    const entries = [
      { type: 'user', message: { role: 'user', content: text } },
      { type: 'user', message: { role: 'user', content: [{ type: 'text', text: 'skill /git:main' }] } },
    ]
    fs.writeFileSync(transcript, entries.map((entry) => JSON.stringify(entry)).join('\n'))
  }
  prompt('/git:commit')

  const call = (rule: string, toolCall: ToolCall) => spawnSync('node', [path.join(RULES, `${rule}.ts`)], {
    input: JSON.stringify({ ...toolCall, cwd: repo, transcript_path: transcript }),
    encoding: 'utf8',
    env: { ...process.env, GIT_GUARD_AUDIT_LOG: auditLog, HOOK_CASES_LOG: casesLog },
  })
  const run = (rule: string, command: string) => call(rule, bash(command))
  const commit = (rule: string, message: string) => run(rule, `git commit -F - <<'EOF'\n${message}\nEOF`)

  return { repo, auditLog, casesLog, git, prompt, call, run, commit }
}

export function allowed(result: SpawnSyncReturns<string>) {
  assert.strictEqual(result.status, 0, result.stderr)
}

export function denied(result: SpawnSyncReturns<string>, pattern: RegExp) {
  assert.strictEqual(result.status, 2, `esperava negar com ${pattern}`)
  assert.match(result.stderr, pattern)
}

export function otherRepo(branch: string): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'git-hooks-other-'))
  initRepo(repo, branch)
  return repo
}
