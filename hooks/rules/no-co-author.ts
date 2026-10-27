import { commitMessage, deny, readInput } from '../lib.ts'

const ATTRIBUTION = /co-authored-by|generated with \[?claude/i

const message = commitMessage(readInput())

if (message && ATTRIBUTION.test(message.full)) {
  deny('no-co-author', 'Co-author or attribution lines are not allowed. Remove the line.')
}
