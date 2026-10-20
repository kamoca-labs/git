import { bodyFile, deny, mergeRequest, readInput, withoutHeredoc } from '../lib.ts'

const WRITES_MR = /\b(gh\s+pr\s+(create|edit|comment|review)|glab\s+mr\s+(create|update|note))\b/
const AI_MENTION = /co-authored-by|generated (with|by)|🤖|\b(claude|anthropic|openai|chatgpt|gpt-?\d|copilot|gemini|codex|deepseek)/i
const INLINE_CODE = /`[^`\n]*`/g

const input = readInput()
const command = input.tool_input.command || ''

function writtenText(): string {
  if (WRITES_MR.test(withoutHeredoc(command))) return `${command}\n${bodyFile(input) ?? ''}`
  const request = mergeRequest(input)
  return request ? `${request.title ?? ''}\n${request.description ?? ''}` : ''
}

if (AI_MENTION.test(writtenText().replace(INLINE_CODE, ''))) {
  deny('mr-no-ai', 'PR/MR sem menção a IA. Remova do título e da descrição: Co-Authored-By, "Generated with", emoji de robô, link de sessão e nome de IA (Claude, ChatGPT, Copilot...). Arquivo ou caminho entre crases pode ficar.')
}
