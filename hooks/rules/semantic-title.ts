import { commitMessage, deny, parseTitle, readInput } from '../lib.ts'

const message = commitMessage(readInput())

if (message && !parseTitle(message.subject)) {
  deny('semantic-title', `Título fora do padrão semântico (tipo(escopo): descrição). Recebido: "${message.subject}"`)
}
