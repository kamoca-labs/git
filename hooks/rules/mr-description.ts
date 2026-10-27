import { deny, mergeRequest, readInput } from '../lib.ts'

const DESCRIPTION_MIN = 80
const DESCRIPTION_MAX = 3000

const request = mergeRequest(readInput())
const isChecked = request && (request.isCreate || request.description !== undefined)
const length = (request?.description || '').trim().length

if (isChecked && (length < DESCRIPTION_MIN || length > DESCRIPTION_MAX)) {
  deny('mr-description', `PR/MR description required, from ${DESCRIPTION_MIN} to ${DESCRIPTION_MAX} chars (it has ${length}).`)
}
