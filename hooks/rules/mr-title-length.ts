import { deny, mergeRequest, readInput, TITLE_MAX } from '../lib.ts'

const title = mergeRequest(readInput())?.title

if (title !== undefined && title.length > TITLE_MAX) {
  deny('mr-title-length', `Título do PR/MR com ${title.length} chars, máximo ${TITLE_MAX} (sem contar "Draft: "): "${title}"`)
}
