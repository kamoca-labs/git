import { test } from 'node:test'
import { allowed, denied, MERGE_REQUEST_CREATES, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-sections'

test('accepts a description with Why and What changes', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('accepts the optional sections after the required ones', () => {
  const description = `${MR_DESCRIPTION}\n\n## How to test\n\nSend an 11 MB attachment.\n\n## References\n\nPR #12.`
  allowed(sandbox().call(RULE, MERGE_REQUEST_CREATES[0]({ title: MR_TITLE, description })))
})

test('denies a description without the required sections and names the missing ones', () => {
  const withoutChanges = '## Why\n\nAttachments above 10 MB blocked the processing queue and crashed the worker.'
  for (const write of MERGE_REQUEST_WRITES) {
    denied(sandbox().call(RULE, write({ title: MR_TITLE, description: withoutChanges })), /\[git:mr-sections\].*## What changes/)
  }
  denied(sandbox().call(RULE, MERGE_REQUEST_CREATES[0]({ description: 'Loose text without any section.' })), /## Why, ## What changes/)
})

test('a PR/MR call without a description is left to mr-description', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE })))
  }
})

test('still accepts the Portuguese section names', () => {
  const description = '## Por quê\n\nAnexos acima de 10 MB travavam a fila de processamento.\n\n## O que muda\n\n- Valida o tamanho antes de enfileirar.'
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description })))
  }
})
