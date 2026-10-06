import { commitMessage, deny, readInput } from '../lib.ts'

const BODY_MIN = 30
const BODY_MAX = 1000
const LINE_MAX = 100

const message = commitMessage(readInput())

if (message) {
  const { body } = message
  if (body.length < BODY_MIN) deny('commit-body', `Body obrigatório (mín ${BODY_MIN} chars) explicando por quê e o quê.`)
  if (body.length > BODY_MAX) deny('commit-body', `Body com ${body.length} chars, máximo ${BODY_MAX}.`)
  const longLine = body.split('\n').find((line) => line.length > LINE_MAX)
  if (longLine) deny('commit-body', `Linha do body acima de ${LINE_MAX} chars, quebre: "${longLine.slice(0, 40)}..."`)
}
