import { commitMessage, deny, readInput, TITLE_MAX } from '../lib.ts'

const message = commitMessage(readInput())

if (message && message.subject.length > TITLE_MAX) {
  deny('title-length', `Title has ${message.subject.length} chars, maximum ${TITLE_MAX}: "${message.subject}"`)
}
