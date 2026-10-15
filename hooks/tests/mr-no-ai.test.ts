import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { allowed, BODY, denied, sandbox } from './helpers.ts'

const RULE = 'mr-no-ai'
const DESCRIPTION = '## Por quê\n\nAnexos acima de 10 MB travavam a fila.\n\n## Como\n\n- Valida o tamanho antes de enfileirar.'

const ghCreate = (title: string, description: string) =>
  `gh pr create --base main --title '${title}' --body-file - <<'EOF'\n${description}\nEOF`

const glabCreate = (title: string, description: string) =>
  `glab mr create --target-branch main --title '${title}' --description "$(cat <<'EOF'\n${description}\nEOF\n)"`

test('aceita PR/MR sem menção a IA', () => {
  const { run } = sandbox()
  allowed(run(RULE, ghCreate('fix(upload): reject files above the limit', DESCRIPTION)))
  allowed(run(RULE, glabCreate('fix(upload): reject files above the limit', DESCRIPTION)))
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
    denied(sandbox().run(RULE, ghCreate('fix: x', `${DESCRIPTION}\n\n${mention}`)), /\[git:mr-no-ai\]/)
  }
})

test('nega menção a IA no título', () => {
  denied(sandbox().run(RULE, ghCreate('feat: add claude support', DESCRIPTION)), /\[git:mr-no-ai\]/)
})

test('nega no GitLab, na edição e no comentário', () => {
  const commands = [
    glabCreate('fix: x', `${DESCRIPTION}\n\nFeito com o Claude.`),
    `glab mr update 12 --description 'Feito com o Claude.'`,
    `glab mr note 12 --message 'Feito com o Claude.'`,
    `gh pr edit 2 --body 'Feito com o Claude.'`,
    `gh pr comment 2 --body 'Feito com o Claude.'`,
    `gh pr review 2 --approve --body 'Feito com o Claude.'`,
  ]
  for (const command of commands) {
    denied(sandbox().run(RULE, command), /\[git:mr-no-ai\]/)
  }
})

test('nega descrição em arquivo com menção a IA', () => {
  const box = sandbox()
  fs.writeFileSync(path.join(box.repo, 'notes.md'), `${DESCRIPTION}\n\nFeito com o Claude.`)
  denied(box.run(RULE, `gh pr create --title 'fix: x' --body-file notes.md`), /\[git:mr-no-ai\]/)
  denied(box.run(RULE, `gh pr create --title 'fix: x' -F notes.md`), /\[git:mr-no-ai\]/)
})

test('aceita arquivo e caminho entre crases', () => {
  const description = `${DESCRIPTION}\n- Atualiza o \`CLAUDE.md\` e o \`.claude/settings.json\`.`
  allowed(sandbox().run(RULE, ghCreate('docs: update the repo conventions', description)))
})

test('ignora o que não escreve no PR/MR', () => {
  const { run, commit } = sandbox()
  allowed(run(RULE, 'gh pr view 2 --json body'))
  allowed(run(RULE, 'glab mr list --author claude'))
  allowed(commit(RULE, `docs: explain the claude hooks\n\n${BODY}\nCita gh pr create --body 'Claude'.`))
})
