import { test } from 'node:test'
import { allowed, denied, gitlabMcpCreate, MR_DESCRIPTION, MR_TITLE, sandbox, type ToolCall } from './helpers.ts'

const RULE = 'mr-no-squash'

const gitlab = (tool: string, toolInput: Record<string, unknown>): ToolCall =>
  ({ tool_name: `mcp__gitlab__${tool}`, tool_input: { project_id: 'kamoca/app', ...toolInput } })

const githubMerge = (mergeMethod: string): ToolCall =>
  ({ tool_name: 'mcp__github__merge_pull_request', tool_input: { owner: 'kamoca', repo: 'app', pullNumber: 2, merge_method: mergeMethod } })

test('criação no MCP do GitLab com squash: false explícito passa', () => {
  allowed(sandbox().call(RULE, gitlabMcpCreate({ title: MR_TITLE, description: MR_DESCRIPTION })))
})

test('criação no MCP do GitLab sem squash explícito é negada', () => {
  const box = sandbox()
  const withoutSquash = { source_branch: 'fix/upload', target_branch: 'main', title: MR_TITLE, description: MR_DESCRIPTION }
  denied(box.call(RULE, gitlab('save_merge_request', withoutSquash)), /\[git:mr-no-squash\].*squash: false/)
  denied(box.call(RULE, gitlab('create_merge_request', withoutSquash)), /squash: false/)
})

test('squash no MCP do GitLab é negado na criação, na atualização e no merge', () => {
  const box = sandbox()
  denied(box.call(RULE, gitlab('save_merge_request', { title: MR_TITLE, description: MR_DESCRIPTION, squash: true })), /\[git:mr-no-squash\]/)
  denied(box.call(RULE, gitlab('save_merge_request', { merge_request_iid: 12, squash: true })), /\[git:mr-no-squash\]/)
  denied(box.call(RULE, gitlab('update_merge_request', { merge_request_iid: 12, squash: true })), /\[git:mr-no-squash\]/)
  denied(box.call(RULE, gitlab('accept_merge_request', { merge_request_iid: 12, squash: true })), /\[git:mr-no-squash\]/)
  denied(box.call(RULE, gitlab('merge_merge_request', { merge_request_iid: 12, squash: true })), /\[git:mr-no-squash\]/)
})

test('atualização e merge no MCP do GitLab sem squash passam', () => {
  const box = sandbox()
  allowed(box.call(RULE, gitlab('save_merge_request', { merge_request_iid: 12, reviewers: ['fulano'] })))
  allowed(box.call(RULE, gitlab('accept_merge_request', { merge_request_iid: 12 })))
})

test('merge com squash no MCP do GitHub é negado', () => {
  const box = sandbox()
  denied(box.call(RULE, githubMerge('squash')), /\[git:mr-no-squash\]/)
  allowed(box.call(RULE, githubMerge('merge')))
  allowed(box.call(RULE, githubMerge('rebase')))
})

test('squash na CLI é negado', () => {
  const commands = [
    'gh pr merge 2 --squash',
    'gh pr merge 2 -s --delete-branch',
    'glab mr merge 12 --squash',
    'glab mr merge 12 -s',
    `glab mr create --target-branch main --title '${MR_TITLE}' --squash-before-merge`,
    'glab mr update 12 --squash-before-merge=true',
  ]
  for (const command of commands) {
    denied(sandbox().run(RULE, command), /\[git:mr-no-squash\]/)
  }
})

test('merge sem squash na CLI passa', () => {
  const box = sandbox()
  allowed(box.run(RULE, 'gh pr merge 2 --merge --delete-branch'))
  allowed(box.run(RULE, 'glab mr merge 12 --remove-source-branch'))
  allowed(box.run(RULE, 'glab mr update 12 --squash-before-merge=false'))
  allowed(box.run(RULE, `gh pr create --title '${MR_TITLE}' --body-file - <<'EOF'\n${MR_DESCRIPTION}\nCita gh pr merge --squash.\nEOF`))
})
