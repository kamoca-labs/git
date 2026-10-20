import { test } from 'node:test'
import { allowed, denied, MERGE_REQUEST_UPDATES, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-semantic-title'

test('aceita título semântico no CLI e no MCP', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('nega título fora do padrão semântico no CLI e no MCP', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    denied(sandbox().call(RULE, write({ title: 'atualiza upload', description: MR_DESCRIPTION })), /\[git:mr-semantic-title\]/)
  }
})

test('o prefixo de draft não conta como parte do título', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: `Draft: ${MR_TITLE}` })))
  }
})

test('atualização sem título passa', () => {
  for (const write of MERGE_REQUEST_UPDATES) {
    allowed(sandbox().call(RULE, write({ description: MR_DESCRIPTION })))
  }
})

test('ignora o que não escreve no PR/MR', () => {
  const box = sandbox()
  allowed(box.run(RULE, 'gh pr view 2 --json title'))
  allowed(box.call(RULE, { tool_name: 'mcp__github__get_pull_request', tool_input: { title: 'atualiza upload' } }))
})
