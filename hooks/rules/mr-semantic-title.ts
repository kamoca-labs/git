import { deny, mergeRequest, parseTitle, readInput } from '../lib.ts'

const title = mergeRequest(readInput())?.title

if (title !== undefined && !parseTitle(title)) {
  deny('mr-semantic-title', `PR/MR title does not follow the semantic format (type(scope): description). Received: "${title}"`)
}
