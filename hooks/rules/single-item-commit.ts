import { commitMessage, deny, parseTitle, readInput } from '../lib.ts'

const CONJUNCTION = /(^|\s)(and|e)(\s|$)|[&+]/i

const message = commitMessage(readInput())
const description = message && parseTitle(message.subject)?.description

if (description && CONJUNCTION.test(description.replace(/`[^`]*`/g, ''))) {
  deny('single-item-commit', `Conjunction (and/&/+) in the title: one subject per commit, split it. "${message.subject}"`)
}
