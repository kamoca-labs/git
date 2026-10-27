import { commitMessage, deny, readInput } from '../lib.ts'

const BODY_MIN = 30
const BODY_MAX = 1000
const LINE_MAX = 100

const message = commitMessage(readInput())

if (message) {
  const { body } = message
  if (body.length < BODY_MIN) deny('commit-body', `Body required (min ${BODY_MIN} chars). Explain why and what.`)
  if (body.length > BODY_MAX) deny('commit-body', `Body has ${body.length} chars, maximum ${BODY_MAX}.`)
  const longLine = body.split('\n').find((line) => line.length > LINE_MAX)
  if (longLine) deny('commit-body', `Body line above ${LINE_MAX} chars. Wrap it: "${longLine.slice(0, 40)}..."`)
}
