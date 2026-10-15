import fs from 'node:fs'
import path from 'node:path'
import { deny, readInput, withoutHeredoc } from '../lib.ts'

const WRITES_MR = /\b(gh\s+pr\s+(create|edit|comment|review)|glab\s+mr\s+(create|update|note))\b/
const AI_MENTION = /co-authored-by|generated (with|by)|🤖|\b(claude|anthropic|openai|chatgpt|gpt-?\d|copilot|gemini|codex|deepseek)/i
const INLINE_CODE = /`[^`\n]*`/g
const BODY_FILE = /(?:--body-file|-F)(?:=|\s+)(['"]?)([^\s'"]+)\1/

const input = readInput()
const command = input.tool_input.command || ''

function bodyFile(): string {
  const file = command.match(BODY_FILE)?.[2]
  if (!file || file === '-') return ''
  try {
    return fs.readFileSync(path.resolve(input.cwd, file), 'utf8')
  } catch {
    return ''
  }
}

if (WRITES_MR.test(withoutHeredoc(command)) && AI_MENTION.test(`${command}\n${bodyFile()}`.replace(INLINE_CODE, ''))) {
  deny('mr-no-ai', 'PR/MR sem menção a IA. Remova do título e da descrição: Co-Authored-By, "Generated with", emoji de robô, link de sessão e nome de IA (Claude, ChatGPT, Copilot...). Arquivo ou caminho entre crases pode ficar.')
}
