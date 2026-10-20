import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export type HookInput = {
  tool_name?: string
  tool_input: { command?: string, [field: string]: unknown }
  cwd: string
  transcript_path?: string
}

export type CommitMessage = { subject: string, body: string, full: string }

export type Title = { type: string, scope: string | null, description: string }

export const TITLE_MAX = 72

export type MergeRequest = { title?: string, description?: string, isCreate: boolean }

type McpMergeRequest = { title?: string, body?: string, description?: string, merge_request_iid?: number }

const HEREDOC = /<<-?\s*['"]?(\w+)['"]?\n([\s\S]*?)\n\s*\1\b/
const DRAFT_PREFIX = /^(Draft|WIP):\s*/i
const CLI_MERGE_REQUEST_WRITE = /\b(?:gh\s+pr|glab\s+mr)\s+(create|edit|update)\b/
const MCP_MERGE_REQUEST_WRITE = /^mcp__.*(?:github|gitlab).*__(create|save|update)_(?:pull|merge)_request$/
const QUOTED_VALUE = `(?:=|\\s+)(?:"((?:[^"\\\\]|\\\\.)*)"|'([^']*)')`
const TITLE_FLAG = new RegExp(`(?:^|\\s)(?:--title|-t)${QUOTED_VALUE}`)
const BODY_FLAG = new RegExp(`(?:^|\\s)(?:--body|-b|--description|-d)${QUOTED_VALUE}`)
const BODY_FILE_FLAG = /(?:--body-file|-F)(?:=|\s+)(['"]?)([^\s'"]+)\1/
const SEMANTIC = /^(feat|fix|refactor|perf|test|docs|style|chore|ci|build|revert)(?:\(([^()\s]+)\))?!?: (\S.*)$/
const PROTECTED_BRANCH = /^(main|master)$/
const GIT_GLOBAL_OPTIONS = String.raw`(?:-[Cc]\s+\S+\s+|-\S+\s+)*`
const CD_PREFIX = /^\s*cd\s+(['"]?)([^'"\s]+)\1\s*&&/
const GIT_DIRECTORY = /\bgit\s+(?:-\S+\s+)*?-C\s+(['"]?)([^'"\s]+)\1/
const CASES_LOG = process.env.HOOK_CASES_LOG || path.join(os.homedir(), '.claude', 'hook-cases.jsonl')

let currentInput: HookInput | null = null

function resolveDirectory(base: string, directory?: string): string {
  return directory ? path.resolve(base, directory.replace(/^~(?=\/|$)/, os.homedir())) : base
}

function commandDirectory(sessionCwd: string, command = ''): string {
  const flags = withoutHeredoc(command)
  const cdDirectory = resolveDirectory(sessionCwd, flags.match(CD_PREFIX)?.[2])
  return resolveDirectory(cdDirectory, flags.match(GIT_DIRECTORY)?.[2])
}

export function readInput(): HookInput {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'))
  currentInput = { ...input, cwd: commandDirectory(input.cwd || process.cwd(), input.tool_input?.command) }
  return currentInput!
}

function capture(rule: string, reason: string) {
  if (!currentInput) return
  const { tool_name, tool_input, cwd, transcript_path } = currentInput
  const useCase = {
    plugin: 'git',
    description: reason,
    origin: 'real',
    branch: git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD'),
    prompt: lastUserPrompt(transcript_path, { raw: true }),
    tool_name,
    tool_input,
    deny: [rule],
  }
  try {
    fs.appendFileSync(CASES_LOG, `${JSON.stringify(useCase)}\n`)
  } catch {}
}

export function deny(rule: string, reason: string): never {
  capture(rule, reason)
  process.stderr.write(`[git:${rule}] ${reason}\n`)
  process.exit(2)
}

export function git(cwd: string, ...args: string[]): string {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

export function isProtectedBranch(cwd: string): boolean {
  return PROTECTED_BRANCH.test(git(cwd, 'rev-parse', '--abbrev-ref', 'HEAD'))
}

export function withoutHeredoc(command: string): string {
  return command.replace(new RegExp(HEREDOC.source, 'g'), '')
}

export function runsGit(command: string, subcommand: string): boolean {
  return new RegExp(`\\bgit\\s+${GIT_GLOBAL_OPTIONS}${subcommand}\\b`).test(withoutHeredoc(command))
}

export function isCommit({ tool_input }: HookInput): boolean {
  return runsGit(tool_input.command || '', 'commit')
}

export function isNoEdit({ tool_input }: HookInput): boolean {
  return /--no-edit\b/.test(tool_input.command || '')
}

function rawMessage(command: string, cwd: string): string | null {
  const heredoc = command.match(HEREDOC)
  if (heredoc) return heredoc[2]

  const file = command.match(/(?:^|\s)(?:-F|--file)(?:=|\s+)(['"]?)([^\s'"]+)\1/)
  if (file && file[2] !== '-') {
    try {
      return fs.readFileSync(path.resolve(cwd, file[2]), 'utf8')
    } catch {
      return null
    }
  }

  const parts = [...command.matchAll(/(?:^|\s)(?:-[a-zA-Z]*m|--message)(?:=|\s+)(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/g)]
    .map((match) => match[1] ?? match[2])
  return parts.length ? parts.join('\n\n') : null
}

export function commitMessage(input: HookInput): CommitMessage | null {
  if (!isCommit(input)) return null
  const full = rawMessage(input.tool_input.command || '', input.cwd)
  if (full === null) return null
  const [subject, ...rest] = full.trim().split('\n')
  return { subject: subject.trim(), body: rest.join('\n').trim(), full }
}

export function parseTitle(subject: string): Title | null {
  const match = subject.match(SEMANTIC)
  return match ? { type: match[1], scope: match[2] ?? null, description: match[3] } : null
}

function lastUserPrompt(transcriptPath?: string, { raw = false } = {}): string {
  let prompt = ''
  let lines: string[] = []
  try {
    lines = fs.readFileSync(transcriptPath || '', 'utf8').split('\n')
  } catch {
    return prompt
  }
  for (const line of lines) {
    if (!line.includes('"user"')) continue
    try {
      const entry = JSON.parse(line)
      const content = entry.message?.content
      if (entry.type === 'user' && !entry.isMeta && typeof content === 'string') prompt = content
    } catch {}
  }
  return raw ? prompt : prompt.replace(/<[^>]+>/g, ' ')
}

export function isMainAllowed({ transcript_path }: HookInput): boolean {
  return /(^|\s)\/git:main\b/.test(lastUserPrompt(transcript_path))
}

function quotedFlag(command: string, flag: RegExp): string | undefined {
  const match = command.match(flag)
  return match ? match[1] ?? match[2] : undefined
}

export function bodyFile({ tool_input, cwd }: HookInput): string | undefined {
  const file = (tool_input.command || '').match(BODY_FILE_FLAG)?.[2]
  if (!file || file === '-') return undefined
  try {
    return fs.readFileSync(path.resolve(cwd, file), 'utf8')
  } catch {
    return undefined
  }
}

function cliMergeRequest(input: HookInput): MergeRequest | null {
  const command = input.tool_input.command || ''
  const flags = withoutHeredoc(command)
  const action = flags.match(CLI_MERGE_REQUEST_WRITE)?.[1]
  if (!action) return null
  return {
    title: quotedFlag(flags, TITLE_FLAG),
    description: command.match(HEREDOC)?.[2] ?? quotedFlag(flags, BODY_FLAG) ?? bodyFile(input),
    isCreate: action === 'create',
  }
}

function mcpMergeRequest({ tool_name = '', tool_input }: HookInput): MergeRequest | null {
  const action = tool_name.match(MCP_MERGE_REQUEST_WRITE)?.[1]
  if (!action) return null
  const { title, body, description, merge_request_iid: iid } = tool_input as McpMergeRequest
  return { title, description: body ?? description, isCreate: action === 'create' || (action === 'save' && iid === undefined) }
}

export function mergeRequest(input: HookInput): MergeRequest | null {
  const request = cliMergeRequest(input) ?? mcpMergeRequest(input)
  return request && { ...request, title: request.title?.replace(DRAFT_PREFIX, '') }
}
