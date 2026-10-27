import { commitMessage, deny, parseTitle, readInput } from '../lib.ts'

const message = commitMessage(readInput())

if (message && !parseTitle(message.subject)) {
  deny('semantic-title', `Title does not follow the semantic format (type(scope): description). Received: "${message.subject}"`)
}
