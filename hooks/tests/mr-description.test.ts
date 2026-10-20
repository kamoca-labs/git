import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { allowed, denied, MERGE_REQUEST_CREATES, MERGE_REQUEST_UPDATES, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-description'

test('aceita descrição entre 80 e 3000 chars', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('nega descrição curta ou longa demais', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    for (const description of ['## Por quê\n\nCurta.', `## Por quê\n\n${'x'.repeat(3000)}`]) {
      denied(sandbox().call(RULE, write({ title: MR_TITLE, description })), /\[git:mr-description\]/)
    }
  }
})

test('nega criação sem descrição', () => {
  for (const write of MERGE_REQUEST_CREATES) {
    denied(sandbox().call(RULE, write({ title: MR_TITLE })), /\[git:mr-description\]/)
  }
})

test('atualização sem descrição passa', () => {
  for (const write of MERGE_REQUEST_UPDATES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE })))
  }
})

test('lê a descrição do arquivo do --body-file', () => {
  const box = sandbox()
  fs.writeFileSync(path.join(box.repo, 'body.md'), MR_DESCRIPTION)
  allowed(box.run(RULE, `gh pr create --title '${MR_TITLE}' --body-file body.md`))
})
