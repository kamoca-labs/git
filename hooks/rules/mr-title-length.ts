import { deny, mergeRequest, readInput, TITLE_MAX } from '../lib.ts'

const title = mergeRequest(readInput())?.title

if (title !== undefined && title.length > TITLE_MAX) {
  deny('mr-title-length', `PR/MR title has ${title.length} chars, maximum ${TITLE_MAX} (not counting "Draft: "): "${title}"`)
}
