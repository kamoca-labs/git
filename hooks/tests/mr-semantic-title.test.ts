import { test } from 'node:test'
import { allowed, denied, MERGE_REQUEST_UPDATES, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-semantic-title'

test('accepts a semantic title on the CLI and the MCP', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('denies a non-semantic title on the CLI and the MCP', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    denied(sandbox().call(RULE, write({ title: 'update upload', description: MR_DESCRIPTION })), /\[git:mr-semantic-title\]/)
  }
})

test('the draft prefix does not count as part of the title', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: `Draft: ${MR_TITLE}` })))
  }
})

test('an update without a title passes', () => {
  for (const write of MERGE_REQUEST_UPDATES) {
    allowed(sandbox().call(RULE, write({ description: MR_DESCRIPTION })))
  }
})

test('ignores what does not write to the PR/MR', () => {
  const box = sandbox()
  allowed(box.run(RULE, 'gh pr view 2 --json title'))
  allowed(box.call(RULE, { tool_name: 'mcp__github__get_pull_request', tool_input: { title: 'update upload' } }))
})
