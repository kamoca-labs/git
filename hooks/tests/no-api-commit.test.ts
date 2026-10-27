import { test } from 'node:test'
import { denied, sandbox } from './helpers.ts'

const RULE = 'no-api-commit'

test('denies a commit through the forge API and asks for /git:commit', () => {
  const tools = [
    'mcp__gitlab__add_commit',
    'mcp__plugin_gitlab_gitlab__create_commit',
    'mcp__github__create_or_update_file',
    'mcp__github__push_files',
    'mcp__plugin_github_github__delete_file',
  ]
  for (const tool of tools) {
    denied(sandbox().call(RULE, { tool_name: tool, tool_input: { branch: 'fix/upload' } }), /\[git:no-api-commit\].*\/git:commit/)
  }
})
