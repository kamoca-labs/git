import { commitMessage, deny, readInput } from '../lib.ts'

const TITLE_MAX = 72

const message = commitMessage(readInput())

if (message && message.subject.length > TITLE_MAX) {
  deny('title-length', `Título com ${message.subject.length} chars, máximo ${TITLE_MAX}: "${message.subject}"`)
}
