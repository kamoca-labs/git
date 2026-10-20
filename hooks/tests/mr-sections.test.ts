import { test } from 'node:test'
import { allowed, denied, MERGE_REQUEST_CREATES, MERGE_REQUEST_WRITES, MR_DESCRIPTION, MR_TITLE, sandbox } from './helpers.ts'

const RULE = 'mr-sections'

test('aceita descrição com Por quê e O que muda', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE, description: MR_DESCRIPTION })))
  }
})

test('aceita as seções opcionais depois das obrigatórias', () => {
  const description = `${MR_DESCRIPTION}\n\n## Como testar\n\nEnvie um anexo de 11 MB.\n\n## Referências\n\nPR #12.`
  allowed(sandbox().call(RULE, MERGE_REQUEST_CREATES[0]({ title: MR_TITLE, description })))
})

test('nega descrição sem as seções obrigatórias e cita as que faltam', () => {
  const withoutChanges = '## Por quê\n\nAnexos acima de 10 MB travavam a fila de processamento e o worker caía.'
  for (const write of MERGE_REQUEST_WRITES) {
    denied(sandbox().call(RULE, write({ title: MR_TITLE, description: withoutChanges })), /\[git:mr-sections\].*## O que muda/)
  }
  denied(sandbox().call(RULE, MERGE_REQUEST_CREATES[0]({ description: 'Texto solto sem seção nenhuma.' })), /## Por quê, ## O que muda/)
})

test('PR/MR sem descrição na chamada fica com o mr-description', () => {
  for (const write of MERGE_REQUEST_WRITES) {
    allowed(sandbox().call(RULE, write({ title: MR_TITLE })))
  }
})
