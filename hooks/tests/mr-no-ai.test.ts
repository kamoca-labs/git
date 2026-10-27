import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { allowed, BODY, denied, ghCreate, glabCreate, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-no-ai'

test('accepts a PR/MR without an AI mention', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('denies attribution and AI mentions in the description', () => {
  const mentions = [
    'Co-Authored-By: X <x@x>',
    'Generated with [Claude Code](https://claude.com/claude-code)',
    '🤖 auto-generated',
    'https://claude.ai/code/session_01',
    'Made with Claude.',
    'Reviewed by Anthropic.',
    'Suggestion from ChatGPT.',
    'Based on the GPT-4o answer.',
    'Code from Copilot.',
    'Research done in Gemini.',
    'Written by Codex.',
    'Compared with DeepSeek.',
    'Model from OpenAI.',
  ]
  for (const mention of mentions) {
    denied(sandbox().call(RULE, ghCreate({ title: 'fix: x', description: `${MR_DESCRIPTION}\n\n${mention}` })), /\[git:mr-no-ai\]/)
  }
})

test('denies an AI mention in the title', () => {
  denied(sandbox().call(RULE, ghCreate({ title: 'feat: add claude support', description: MR_DESCRIPTION })), /\[git:mr-no-ai\]/)
})

test('denies on GitLab, on edit and on comment', () => {
  const box = sandbox()
  denied(box.call(RULE, glabCreate({ title: 'fix: x', description: `${MR_DESCRIPTION}\n\nMade with Claude.` })), /\[git:mr-no-ai\]/)
  const commands = [
    `glab mr update 12 --description 'Made with Claude.'`,
    `glab mr note 12 --message 'Made with Claude.'`,
    `gh pr edit 2 --body 'Made with Claude.'`,
    `gh pr comment 2 --body 'Made with Claude.'`,
    `gh pr review 2 --approve --body 'Made with Claude.'`,
  ]
  for (const command of commands) {
    denied(box.run(RULE, command), /\[git:mr-no-ai\]/)
  }
})

test('denies an AI mention in the title and the description through the MCP', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    denied(sandbox().call(RULE, write({ title: MR_TITLE, description: `${MR_DESCRIPTION}\n\nGenerated with Claude.` })), /\[git:mr-no-ai\]/)
    denied(sandbox().call(RULE, write({ title: 'feat: add copilot support' })), /\[git:mr-no-ai\]/)
  }
})

test('denies a description file with an AI mention', () => {
  const box = sandbox()
  fs.writeFileSync(path.join(box.repo, 'notes.md'), `${MR_DESCRIPTION}\n\nMade with Claude.`)
  denied(box.run(RULE, `gh pr create --title 'fix: x' --body-file notes.md`), /\[git:mr-no-ai\]/)
  denied(box.run(RULE, `gh pr create --title 'fix: x' -F notes.md`), /\[git:mr-no-ai\]/)
})

test('accepts a file and a path in backticks', () => {
  const description = `${MR_DESCRIPTION}\n- Updates the \`CLAUDE.md\` and the \`.claude/settings.json\`.`
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: 'docs: update the repo conventions', description })))
  }
})

test('ignores what does not write to the PR/MR', () => {
  const { call, run, commit } = sandbox()
  allowed(run(RULE, 'gh pr view 2 --json body'))
  allowed(run(RULE, 'glab mr list --author claude'))
  allowed(call(RULE, { tool_name: 'mcp__github__search_pull_requests', tool_input: { query: 'author:claude' } }))
  allowed(commit(RULE, `docs: explain the claude hooks\n\n${BODY}\nQuotes gh pr create --body 'Claude'.`))
})
