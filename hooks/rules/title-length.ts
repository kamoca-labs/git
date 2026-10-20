import { commitMessage, deny, readInput, TITLE_MAX } from '../lib.ts'

const message = commitMessage(readInput())

if (message && message.subject.length > TITLE_MAX) {
  deny('title-length', `Título com ${message.subject.length} chars, máximo ${TITLE_MAX}: "${message.subject}"`)
}
