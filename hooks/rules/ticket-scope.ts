import { commitMessage, deny, parseTitle, readInput, ticket } from '../lib.ts'

const input = readInput()
const message = commitMessage(input)
const expected = message && ticket(input)

if (expected && parseTitle(message.subject)?.scope !== expected) {
  deny('ticket-scope', `Com /git:chamado o escopo deve ser o chamado: tipo(${expected}): ...`)
}
