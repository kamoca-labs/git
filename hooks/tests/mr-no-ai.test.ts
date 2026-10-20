import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { allowed, BODY, denied, ghCreate, glabCreate, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-no-ai'

test('aceita PR/MR sem menção a IA', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('nega atribuição e menção a IA na descrição', () => {
  const mentions = [
    'Co-Authored-By: X <x@x>',
    'Generated with [Claude Code](https://claude.com/claude-code)',
    '🤖 gerado automaticamente',
    'https://claude.ai/code/session_01',
    'Feito com o Claude.',
    'Revisado pela Anthropic.',
    'Sugestão do ChatGPT.',
    'Baseado na resposta do GPT-4o.',
    'Código do Copilot.',
    'Pesquisa feita no Gemini.',
    'Escrito pelo Codex.',
    'Comparado com o DeepSeek.',
    'Modelo da OpenAI.',
  ]
  for (const mention of mentions) {
    denied(sandbox().call(RULE, ghCreate({ title: 'fix: x', description: `${MR_DESCRIPTION}\n\n${mention}` })), /\[git:mr-no-ai\]/)
  }
})

test('nega menção a IA no título', () => {
  denied(sandbox().call(RULE, ghCreate({ title: 'feat: add claude support', description: MR_DESCRIPTION })), /\[git:mr-no-ai\]/)
})

test('nega no GitLab, na edição e no comentário', () => {
  const box = sandbox()
  denied(box.call(RULE, glabCreate({ title: 'fix: x', description: `${MR_DESCRIPTION}\n\nFeito com o Claude.` })), /\[git:mr-no-ai\]/)
  const commands = [
    `glab mr update 12 --description 'Feito com o Claude.'`,
    `glab mr note 12 --message 'Feito com o Claude.'`,
    `gh pr edit 2 --body 'Feito com o Claude.'`,
    `gh pr comment 2 --body 'Feito com o Claude.'`,
    `gh pr review 2 --approve --body 'Feito com o Claude.'`,
  ]
  for (const command of commands) {
    denied(box.run(RULE, command), /\[git:mr-no-ai\]/)
  }
})

test('nega menção a IA no título e na descrição pelo MCP', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    denied(sandbox().call(RULE, write({ title: MR_TITLE, description: `${MR_DESCRIPTION}\n\nGenerated with Claude.` })), /\[git:mr-no-ai\]/)
    denied(sandbox().call(RULE, write({ title: 'feat: add copilot support' })), /\[git:mr-no-ai\]/)
  }
})

test('nega descrição em arquivo com menção a IA', () => {
  const box = sandbox()
  fs.writeFileSync(path.join(box.repo, 'notes.md'), `${MR_DESCRIPTION}\n\nFeito com o Claude.`)
  denied(box.run(RULE, `gh pr create --title 'fix: x' --body-file notes.md`), /\[git:mr-no-ai\]/)
  denied(box.run(RULE, `gh pr create --title 'fix: x' -F notes.md`), /\[git:mr-no-ai\]/)
})

test('aceita arquivo e caminho entre crases', () => {
  const description = `${MR_DESCRIPTION}\n- Atualiza o \`CLAUDE.md\` e o \`.claude/settings.json\`.`
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: 'docs: update the repo conventions', description })))
  }
})

test('ignora o que não escreve no PR/MR', () => {
  const { call, run, commit } = sandbox()
  allowed(run(RULE, 'gh pr view 2 --json body'))
  allowed(run(RULE, 'glab mr list --author claude'))
  allowed(call(RULE, { tool_name: 'mcp__github__search_pull_requests', tool_input: { query: 'author:claude' } }))
  allowed(commit(RULE, `docs: explain the claude hooks\n\n${BODY}\nCita gh pr create --body 'Claude'.`))
})
