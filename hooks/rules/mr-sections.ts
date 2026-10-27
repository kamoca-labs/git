import { deny, mergeRequest, readInput } from '../lib.ts'

const SECTIONS = [
  { name: '## Why', accepted: ['## Why', '## Por quê'] },
  { name: '## What changes', accepted: ['## What changes', '## O que muda'] },
]

const description = mergeRequest(readInput())?.description
const missing = description === undefined
  ? []
  : SECTIONS.filter(({ accepted }) => !accepted.some((heading) => description.includes(heading)))

if (missing.length) {
  deny('mr-sections', `PR/MR description is missing the required sections: ${missing.map(({ name }) => name).join(', ')}`)
}
