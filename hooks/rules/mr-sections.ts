import { deny, mergeRequest, readInput } from '../lib.ts'

const SECTIONS = ['## Por quê', '## O que muda']

const description = mergeRequest(readInput())?.description
const missing = description === undefined ? [] : SECTIONS.filter((section) => !description.includes(section))

if (missing.length) {
  deny('mr-sections', `Descrição do PR/MR sem as seções obrigatórias: ${missing.join(', ')}`)
}
