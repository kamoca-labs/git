import { deny, mergeRequest, parseTitle, readInput } from '../lib.ts'

const title = mergeRequest(readInput())?.title

if (title !== undefined && !parseTitle(title)) {
  deny('mr-semantic-title', `Título do PR/MR fora do padrão semântico (tipo(escopo): descrição). Recebido: "${title}"`)
}
