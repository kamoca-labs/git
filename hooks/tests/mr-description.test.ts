import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { allowed, denied, MERGE_REQUEST_CREATES, MERGE_REQUEST_UPDATES, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-description'

test('accepts a description from 80 to 3000 chars', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('denies a description that is too short or too long', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    for (const description of ['## Why\n\nShort.', `## Why\n\n${'x'.repeat(3000)}`]) {
      denied(sandbox().call(RULE, write({ title: MR_TITLE, description })), /\[git:mr-description\]/)
    }
  }
})

test('denies a creation without a description', () => {
  for (const write of MERGE_REQUEST_CREATES) {
    denied(sandbox().call(RULE, write({ title: MR_TITLE })), /\[git:mr-description\]/)
  }
})

test('an update without a description passes', () => {
  for (const write of MERGE_REQUEST_UPDATES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE })))
  }
})

test('reads the description from the --body-file file', () => {
  const box = sandbox()
  fs.writeFileSync(path.join(box.repo, 'body.md'), MR_DESCRIPTION)
  allowed(box.run(RULE, `gh pr create --title '${MR_TITLE}' --body-file body.md`))
})
